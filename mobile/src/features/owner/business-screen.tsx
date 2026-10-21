import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, SectionTitle, Serial, Sheet } from '@/components/ui/nota';
import { QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useSession } from '@/data/api/provider';
import { executionStatus } from '@/core/i18n/status';
import { formatDate } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';

/**
 * Pelanggan bisnis (BIZ-01–08). Staf melihat kontribusi; pelanggan B2B hanya melihat organisasinya sendiri
 * tanpa margin. Tarif kedaluwarsa tidak dipakai diam-diam.
 */
export function BusinessScreen() {
  const router = useRouter();
  const session = useSession();
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const q = useTovvQuery(['business-accounts'], (a) => a.listBusinessAccounts());
  return (
    <Screen header={<DetailHeader title={staff ? 'Pelanggan bisnis' : 'Organisasi saya'} subtitle="Rate card, mandat, PO dan layanan" />}>
      <QueryView q={q}>
        {(list) => (
          <View style={{ gap: space.lg }}>
            {list.map((b) => (
              <View key={b.id}>
                <SectionTitle title={b.name} />
                <Sheet>
                  <Serial>{b.alias}</Serial>
                  <Txt variant="bodySm" tone="inkSecondary">{`Syarat ${b.termsVersion} · net-${b.netDays} · PO ${b.poRequired ? 'wajib' : 'opsional'}`}</Txt>
                  <View style={{ marginTop: space.sm }}>
                    {b.rateCards.map((rc) => (
                      <LineItem key={rc.id} label={rc.route} hint={`${formatDate(rc.validFrom)} – ${formatDate(rc.validTo)} · ${rc.valid ? 'berlaku' : 'KEDALUWARSA — tarif standar/review'}`} value={<Money value={rc.amount} strike={!rc.valid} />} />
                    ))}
                  </View>
                  <LineItem label="Anggota" value={<Txt variant="bodySm" align="right">{b.members.map((m) => `${m.name} (${m.roles.join(', ')})`).join('\n')}</Txt>} />
                  <LineItem label="Order dalam periode" value={<Txt variant="figure">{String(b.orders)}</Txt>} />
                  <LineItem label="Invoice net" value={<Money value={b.invoiceNet} />} />
                  <LineItem label="Piutang" value={<Money value={b.receivable} />} />
                  {staff ? <LineItem label="Kontribusi final (internal)" hint={b.provisional ? `${b.provisional} pekerjaan provisional tidak dihitung` : undefined} value={<Money value={b.contribution} missingLabel="belum ada final" />} /> : null}
                  <Txt variant="label" tone="inkSecondary" style={{ marginTop: space.md }}>Rute favorit</Txt>
                  {b.favoriteRoutes.map((f) => <Txt key={f.id} variant="bodySm">{`• ${f.label}`}</Txt>)}
                  <Txt variant="label" tone="inkSecondary" style={{ marginTop: space.md }}>Order terbaru</Txt>
                  {b.recentOrders.map((o) => (
                    <Button key={o.id} label={`${o.alias} · ${executionStatus[o.status].label}${o.poRef ? ` · ${o.poRef}` : ''}`} variant="quiet" compact onPress={() => router.push(`/order/${o.id}`)} style={{ alignSelf: 'flex-start' }} />
                  ))}
                </Sheet>
                {!staff ? <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>{`Ringkasan organisasi tanpa biaya internal operator. Piutang ${formatRupiah(b.receivable)}.`}</Txt> : null}
              </View>
            ))}
          </View>
        )}
      </QueryView>
    </Screen>
  );
}
