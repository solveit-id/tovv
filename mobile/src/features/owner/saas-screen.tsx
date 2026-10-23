import React from 'react';
import { View } from 'react-native';
import { space } from '@/core/design/tokens';
import { useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, Rule, SectionTitle, Serial, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { DocumentStack } from '@/components/business/document-stack';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import { usageStatus } from '@/core/i18n/status';
import { formatDate } from '@/core/format/time';
import { t } from '@/core/i18n';

/**
 * Paket SaaS DEMO (SUB-01–06): langganan vs bayar per layanan sukses. Pratinjau tagihan langganan terpisah dari
 * invoice jasa operator, berwatermark DEMO, tanpa checkout atau pungutan.
 */
export function SaasScreen() {
  const color = useColors();
  const q = useTovvQuery(['saas'], (a) => a.getSaas());
  const change = useTovvMutation((a, kind: 'subscription' | 'success') => a.schedulePlanChange(kind), { success: 'Paket baru berlaku mulai periode berikutnya. Pesanan yang sedang jalan tetap memakai ketentuan lama.' });
  return (
    <Screen header={<DetailHeader title="Paket langganan Tovv (DEMO)" subtitle="Harga contoh · tidak ditagih" />}>
      <QueryView q={q}>
        {(s) => (
          <>
            {s.expiredFixture ? (
              <Card style={{ marginBottom: space.md }}>
                <Txt variant="bodyStrong" tone="warnInk">Paket demo kedaluwarsa</Txt>
                <Txt variant="bodySm">Order baru diblokir sesuai aturan demo. Order yang jalan, bukti, invoice, dan pembayaran tetap bisa dibuka.</Txt>
              </Card>
            ) : null}
            <Card>
              <Txt variant="label" tone="inkSecondary">Paket aktif</Txt>
              <Txt variant="headline">{s.plan.label}</Txt>
              <Txt variant="bodySm" tone="inkSecondary">{`${s.plan.version} · ${s.plan.kind === 'subscription' ? 'tetap per 30 hari, tanpa biaya per layanan' : 'per layanan sukses (handover + bukti minimum + diterima)'}`}</Txt>
              <LineItem label={s.plan.kind === 'subscription' ? 'Nominal per periode' : 'Per layanan yang berhasil'} value={<Money value={s.plan.amount} />} />
              {s.scheduledChange ? <Txt variant="bodySm" tone="accentInk">{t('Terjadwal pindah ke {0} mulai {1}', [s.scheduledChange.toKind === 'subscription' ? 'langganan' : 'per layanan', formatDate(s.scheduledChange.effectiveFrom)])}</Txt> : null}
              <Button
                label={s.plan.kind === 'subscription' ? 'Jadwalkan pindah ke per layanan' : 'Jadwalkan pindah ke langganan'}
                variant="secondary"
                compact
                loading={change.isPending}
                onPress={() => change.mutate(s.plan.kind === 'subscription' ? 'success' : 'subscription')}
                style={{ alignSelf: 'flex-start', marginTop: space.sm }}
              />
            </Card>

            <SectionTitle title="Perbandingan volume contoh (simulasi)" />
            <Card padded={false}>
              {s.comparison.map((c) => (
                <View key={c.volume} style={{ flexDirection: 'row', padding: space.md, gap: space.md, borderBottomWidth: 1, borderBottomColor: color.line }}>
                  <Txt variant="bodySm" style={{ width: 92 }}>{`${c.volume} layanan`}</Txt>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}><Txt variant="caption" tone="inkSecondary">Langganan</Txt><Money value={c.subscription} size="sm" /></View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}><Txt variant="caption" tone="inkSecondary">Per layanan</Txt><Money value={c.success} size="sm" /></View>
                </View>
              ))}
            </Card>
            <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>Angka contoh untuk bahan diskusi; bukan harga final.</Txt>

            {s.usage.length ? (
              <>
                <SectionTitle title="Catatan pemakaian" count={s.usage.length} />
                <Card>
                  {s.usage.map((u) => (
                    <LineItem key={u.id} label={u.alias} hint={u.note || undefined} value={<View style={{ alignItems: 'flex-end', gap: 2 }}><StatusTag look={usageStatus[u.status]} size="sm" /><Money value={u.amount} size="sm" /></View>} />
                  ))}
                  <Txt variant="caption" tone="inkSecondary">Satu layanan = satu kali tercatat; serah-terima ulang tidak menambah biaya.</Txt>
                </Card>
              </>
            ) : null}

            <SectionTitle title="Pratinjau tagihan langganan" />
            <DocumentStack>
              <Serial>{s.invoicePreview.number}</Serial>
              <Txt variant="bodySm" tone="inkSecondary">{s.invoicePreview.issuer}</Txt>
              <Txt variant="caption" tone="dangerInk" style={{ fontWeight: '700' }}>PRATINJAU DEMO · TIDAK BISA DIBAYAR · TERPISAH DARI INVOICE JASA</Txt>
              <Rule />
              {s.invoicePreview.lines.map((l) => <LineItem key={l.label} label={l.label} value={<Money value={l.amount} />} />)}
              <Rule strong />
              <LineItem label="Total periode (ilustrasi)" emphasis value={<Money value={s.invoicePreview.total} size="lg" />} />
            </DocumentStack>
          </>
        )}
      </QueryView>
    </Screen>
  );
}
