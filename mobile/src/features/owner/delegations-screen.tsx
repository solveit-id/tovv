import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { space } from '@/core/design/tokens';
import { useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField } from '@/components/ui/form';
import { LineItem, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useApi } from '@/data/api/provider';
import { errorMessage, useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import type { DelegationScope } from '@/domain/types';
import type { StatusLook } from '@/core/i18n/status';
import { formatDateTime } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';
import { t } from '@/core/i18n';

const SCOPES: { value: DelegationScope; label: string; hint: string }[] = [
  { value: 'quote.send', label: 'Kirim penawaran', hint: 'Harga di atas target dan biaya lengkap' },
  { value: 'quote.override_within_limit', label: 'Diskon dalam batas', hint: 'Sampai batas nominal di bawah target' },
  { value: 'assignment.manage', label: 'Atur penugasan', hint: 'Tawarkan/pindahkan sopir' },
  { value: 'expense.approve', label: 'Setujui biaya', hint: 'Biaya aktual dan uang jalan' },
  { value: 'invoice.issue', label: 'Terbitkan invoice', hint: 'Dari penawaran disetujui' },
  { value: 'payment.verify', label: 'Periksa pembayaran', hint: 'Hanya bila owner memberi akses keuangan' },
];

const STATUS: Record<string, StatusLook> = {
  active: { label: 'Aktif', tone: 'ok', line: 'solid', icon: 'shield-check-outline' },
  expired: { label: 'Berakhir', tone: 'neutral', line: 'struck', icon: 'timer-off-outline' },
  revoked: { label: 'Dicabut', tone: 'neutral', line: 'struck', icon: 'shield-off-outline' },
  scheduled: { label: 'Terjadwal', tone: 'info', line: 'dashed', icon: 'clock-outline' },
};

/** Delegasi terbatas (FIN-04): template izin tetap, batas nominal, masa ≤ 8 jam, cabut kapan saja. Tidak bisa didelegasikan ulang. */
export function DelegationsScreen() {
  const color = useColors();
  const api = useApi();
  const q = useTovvQuery(['delegations'], (a) => a.listDelegations());
  const admins = useTovvQuery(['admins'], (a) => a.listAdmins());
  const revoke = useTovvMutation((a, id: string) => a.revokeDelegation(id), { success: 'Delegasi dicabut; tindakan berikutnya dari penerima delegasi akan ditolak.' });
  const [open, setOpen] = useState(false);
  const [delegate, setDelegate] = useState('');
  const [scopes, setScopes] = useState<DelegationScope[]>(['quote.send', 'quote.override_within_limit', 'assignment.manage']);
  const [limit, setLimit] = useState<number | null>(100_000);
  const [hours, setHours] = useState('8');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const grant = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.grantDelegation({ delegateId: delegate, scopes, limit: limit ?? 0, hours: Number(hours), reason });
      setOpen(false);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={<DetailHeader title="Delegasi" subtitle="Wewenang harga terbatas saat owner tidak tersedia" />} footer={<Button label="Beri delegasi" icon="account-key-outline" size="lg" onPress={() => setOpen(true)} />}>
      <QueryView q={q}>
        {(list) =>
          list.length ? (
            <View style={{ gap: space.md }}>
              {list.map((d) => (
                <Card key={d.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                    <Txt variant="bodyStrong">{d.delegateName}</Txt>
                    <StatusTag look={STATUS[d.status]!} size="sm" />
                  </View>
                  <Txt variant="bodySm" tone="inkSecondary">{d.reason}</Txt>
                  <View style={{ marginTop: space.sm }}>
                    {d.scopes.map((s) => <Txt key={s} variant="bodySm">{`• ${SCOPES.find((x) => x.value === s)?.label ?? s}`}</Txt>)}
                  </View>
                  <LineItem label="Batas diskon dari target" value={<Txt variant="figure">{formatRupiah(d.limit)}</Txt>} />
                  <LineItem label="Berlaku" value={<Txt variant="caption">{`${formatDateTime(d.effectiveAt)} – ${formatDateTime(d.expiresAt)}`}</Txt>} />
                  {d.status === 'active' ? <Button label="Cabut sekarang" variant="danger" compact loading={revoke.isPending} onPress={() => revoke.mutate(d.id)} style={{ alignSelf: 'flex-start', marginTop: space.sm }} /> : null}
                </Card>
              ))}
            </View>
          ) : <EmptyBlock icon="account-key-outline" title="Belum ada delegasi" />
        }
      </QueryView>
      <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.md }}>Server tetap mengecek izin setiap kali ada tindakan; delegasi tidak memberi akses rekening, akses dukungan, atau hak mendelegasikan lagi.</Txt>
      <BottomSheet visible={open} title="Beri delegasi" onClose={() => setOpen(false)} footer={<>{err ? <Txt variant="bodySm" tone="dangerInk">{err}</Txt> : null}<Button label="Simpan delegasi" loading={busy} onPress={() => void grant()} /></>}>
        <Choice label="Penerima" value={delegate} onChange={setDelegate} options={(admins.data ?? []).map((a) => ({ value: a.id, label: `${a.name} (${a.role})` }))} />
        <Txt variant="label" tone="inkSecondary">Izin</Txt>
        <View style={{ gap: space.xs, marginVertical: space.sm }}>
          {SCOPES.map((s) => {
            const on = scopes.includes(s.value);
            return (
              <Pressable key={s.value} onPress={() => setScopes((cur) => (on ? cur.filter((x) => x !== s.value) : [...cur, s.value]))} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', minHeight: 48, paddingHorizontal: space.sm, borderRadius: 8, backgroundColor: on ? color.accentSoft : 'transparent' }}>
                <Icon name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} tone={on ? 'accentInk' : 'inkSecondary'} />
                <View style={{ flex: 1 }}><Txt variant="bodySm" style={{ fontWeight: '600' }}>{s.label}</Txt><Txt variant="caption" tone="inkSecondary">{s.hint}</Txt></View>
              </Pressable>
            );
          })}
        </View>
        <MoneyField label="Batas diskon dari target" value={limit} onChange={setLimit} />
        <Choice label="Masa berlaku" value={hours} onChange={setHours} options={[{ value: '2', label: '2 jam' }, { value: '4', label: '4 jam' }, { value: '8', label: '8 jam (maksimum demo)' }]} />
        <Field label="Alasan" value={reason} onChangeText={setReason} placeholder={t('mis. owner mengemudi A06')} />
      </BottomSheet>
    </Screen>
  );
}
