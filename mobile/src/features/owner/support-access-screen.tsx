import React, { useState } from 'react';
import { View } from 'react-native';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Choice, Field } from '@/components/ui/form';
import { LineItem, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import type { StatusLook } from '@/core/i18n/status';
import { formatDateTime } from '@/core/format/time';

const LOOK: Record<string, StatusLook> = {
  active: { label: 'Aktif', tone: 'warn', line: 'solid', icon: 'account-eye-outline' },
  expired: { label: 'Berakhir', tone: 'neutral', line: 'struck', icon: 'timer-off-outline' },
  revoked: { label: 'Dicabut', tone: 'neutral', line: 'struck', icon: 'account-cancel-outline' },
};

/**
 * Persetujuan akses dukungan Solveit (TEN-05, D-06). Dashboard Solveit Admin belum terhubung: staf dukungan
 * di sini adalah ADMIN STUB; integrasi aktual BLOCKED sampai repo website tersedia.
 */
export function SupportAccessScreen() {
  const q = useTovvQuery(['support-grants'], (a) => a.listSupportGrants());
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState('trips.read');
  const [hours, setHours] = useState('2');
  const [reason, setReason] = useState('');
  const approve = useTovvMutation((a, _: void) => a.approveSupportGrant(scope === 'both' ? ['trips.read', 'location.read'] : [scope], Number(hours), reason), { success: 'Akses dukungan disetujui dan berakhir otomatis.', onSuccess: () => setOpen(false) });
  const revoke = useTovvMutation((a, id: string) => a.revokeSupportGrant(id), { success: 'Akses dicabut; permintaan berikutnya ditolak.' });
  return (
    <Screen header={<DetailHeader title="Akses dukungan Solveit" subtitle="ADMIN STUB · integrasi aktual BLOCKED" />} footer={<Button label="Setujui akses sementara" icon="shield-account-outline" size="lg" onPress={() => setOpen(true)} />}>
      <Card style={{ marginBottom: space.md }}>
        <Txt variant="bodySm">Staf platform hanya melihat ringkasan kesehatan dan pemakaian tanpa izin khusus. Detail perjalanan atau lokasi memerlukan persetujuan owner dengan cakupan dan masa berlaku; semua akses tercatat.</Txt>
      </Card>
      <QueryView q={q}>
        {(list) =>
          list.length ? (
            <View style={{ gap: space.md }}>
              {list.map((g) => (
                <Card key={g.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>{g.actorLabel}</Txt>
                    <StatusTag look={LOOK[g.status]!} size="sm" />
                  </View>
                  <LineItem label="Cakupan" value={<Txt variant="mono">{g.scopes.join(', ')}</Txt>} />
                  <LineItem label="Alasan" value={<Txt variant="bodySm">{g.reason}</Txt>} />
                  <LineItem label="Berlaku sampai" value={<Txt variant="bodySm">{formatDateTime(g.expiresAt)}</Txt>} />
                  {g.status === 'active' ? <Button label="Cabut" variant="danger" compact onPress={() => revoke.mutate(g.id)} style={{ alignSelf: 'flex-start' }} /> : null}
                </Card>
              ))}
            </View>
          ) : <EmptyBlock icon="shield-outline" title="Belum ada akses dukungan" />
        }
      </QueryView>
      <BottomSheet visible={open} title="Setujui akses dukungan" onClose={() => setOpen(false)} footer={<Button label="Setujui" loading={approve.isPending} onPress={() => approve.mutate(undefined)} />}>
        <Choice label="Cakupan" value={scope} onChange={setScope} options={[{ value: 'trips.read', label: 'Detail perjalanan' }, { value: 'location.read', label: 'Lokasi perjalanan' }, { value: 'both', label: 'Keduanya' }]} />
        <Choice label="Masa berlaku" value={hours} onChange={setHours} options={[{ value: '1', label: '1 jam' }, { value: '2', label: '2 jam' }, { value: '8', label: '8 jam' }]} />
        <Field label="Alasan" value={reason} onChangeText={setReason} placeholder="mis. memeriksa sinkronisasi A06" />
      </BottomSheet>
    </Screen>
  );
}
