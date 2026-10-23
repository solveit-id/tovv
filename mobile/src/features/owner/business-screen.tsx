import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, SectionTitle, Serial, Card } from '@/components/ui/surface';
import { QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useSession } from '@/data/api/provider';
import { executionStatus } from '@/core/i18n/status';
import { formatDate } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';
import { t } from '@/core/i18n';

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
    <Screen header={<DetailHeader title={staff ? 'Pelanggan bisnis' : 'Organisasi saya'} subtitle="Tarif khusus, siapa yang boleh memesan, PO, dan layanan" />}>
      <QueryView q={q}>
        {(list) => (
          <View style={{ gap: space.lg }}>
            {list.map((b) => (
              <View key={b.id}>
                <SectionTitle title={b.name} />
                <Card>
                  <Serial>{b.alias}</Serial>
                  <Txt variant="bodySm" tone="inkSecondary">{t('Syarat {0} · net-{1} · PO {2}', [b.termsVersion, b.netDays, b.poRequired ? 'wajib' : 'opsional'])}</Txt>
                  <View style={{ marginTop: space.sm }}>
                    {b.rateCards.map((rc) => (
                      <LineItem key={rc.id} label={rc.route} hint={`${formatDate(rc.validFrom)} – ${formatDate(rc.validTo)} · ${rc.valid ? 'berlaku' : 'KEDALUWARSA — pakai tarif standar/dicek ulang'}`} value={<Money value={rc.amount} strike={!rc.valid} />} />
                    ))}
                  </View>
                  <LineItem label="Anggota" value={<Txt variant="bodySm" align="right">{b.members.map((m) => `${m.name} (${m.roles.join(', ')})`).join('\n')}</Txt>} />
                  <LineItem label="Order dalam periode" value={<Txt variant="figure">{String(b.orders)}</Txt>} />
                  <LineItem label="Total invoice" value={<Money value={b.invoiceNet} />} />
                  <LineItem label="Belum dibayar" value={<Money value={b.receivable} />} />
                  {staff ? <LineItem label="Kontribusi final (internal)" hint={b.provisional ? t('{0} pekerjaan masih sementara, belum dihitung', [b.provisional]) : undefined} value={<Money value={b.contribution} missingLabel="belum ada final" />} /> : null}
                  <Txt variant="label" tone="inkSecondary" style={{ marginTop: space.md }}>Rute favorit</Txt>
                  {b.favoriteRoutes.map((f) => <Txt key={f.id} variant="bodySm">{`• ${f.label}`}</Txt>)}
                  <Txt variant="label" tone="inkSecondary" style={{ marginTop: space.md }}>Order terbaru</Txt>
                  {b.recentOrders.map((o) => (
                    <Button key={o.id} label={`${o.alias} · ${executionStatus[o.status].label}${o.poRef ? ` · ${o.poRef}` : ''}`} variant="quiet" compact onPress={() => router.push(`/order/${o.id}`)} style={{ alignSelf: 'flex-start' }} />
                  ))}
                </Card>
                {!staff ? <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>{t('Ringkasan organisasi tanpa biaya internal operator. Belum dibayar {0}.', [formatRupiah(b.receivable)])}</Txt> : null}
              </View>
            ))}
          </View>
        )}
      </QueryView>
    </Screen>
  );
}
