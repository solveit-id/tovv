import React from 'react';
import { View } from 'react-native';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, Rule, SectionTitle, Serial, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { DocumentStack } from '@/components/nota/document-stack';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import { usageStatus } from '@/core/i18n/status';
import { formatDate } from '@/core/format/time';

/**
 * Paket SaaS DEMO (SUB-01–06): langganan vs bayar per layanan sukses. Preview invoice SaaS terpisah dari
 * invoice jasa operator, berwatermark DEMO, tanpa checkout atau pungutan.
 */
export function SaasScreen() {
  const q = useTovvQuery(['saas'], (a) => a.getSaas());
  const change = useTovvMutation((a, kind: 'subscription' | 'success') => a.schedulePlanChange(kind), { success: 'Perubahan paket dijadwalkan untuk periode berikutnya; order aktif tetap memakai snapshot lama.' });
  return (
    <Screen header={<DetailHeader title="Paket SaaS (DEMO)" subtitle="Harga ilustrasi · tidak dipungut" />}>
      <QueryView q={q}>
        {(s) => (
          <>
            {s.expiredFixture ? (
              <Sheet style={{ marginBottom: space.md }}>
                <Txt variant="bodyStrong" tone="warnInk">Paket demo kedaluwarsa</Txt>
                <Txt variant="bodySm">Order baru diblokir sesuai policy demo. Order aktif, bukti, invoice, dan pembayaran tetap dapat diakses.</Txt>
              </Sheet>
            ) : null}
            <Sheet>
              <Txt variant="label" tone="inkSecondary">Paket aktif</Txt>
              <Txt variant="headline">{s.plan.label}</Txt>
              <Txt variant="bodySm" tone="inkSecondary">{`${s.plan.version} · ${s.plan.kind === 'subscription' ? 'tetap per 30 hari, tanpa biaya per layanan' : 'per layanan sukses (handover + bukti minimum + diterima)'}`}</Txt>
              <LineItem label={s.plan.kind === 'subscription' ? 'Nominal per periode' : 'Per layanan sukses'} value={<Money value={s.plan.amount} />} />
              {s.scheduledChange ? <Txt variant="bodySm" tone="carbon">{`Terjadwal pindah ke ${s.scheduledChange.toKind === 'subscription' ? 'langganan' : 'per layanan'} mulai ${formatDate(s.scheduledChange.effectiveFrom)}`}</Txt> : null}
              <Button
                label={s.plan.kind === 'subscription' ? 'Jadwalkan pindah ke per layanan' : 'Jadwalkan pindah ke langganan'}
                variant="secondary"
                compact
                loading={change.isPending}
                onPress={() => change.mutate(s.plan.kind === 'subscription' ? 'success' : 'subscription')}
                style={{ alignSelf: 'flex-start', marginTop: space.sm }}
              />
            </Sheet>

            <SectionTitle title="Perbandingan volume hipotetis (simulasi)" />
            <Sheet padded={false}>
              {s.comparison.map((c) => (
                <View key={c.volume} style={{ flexDirection: 'row', padding: space.md, gap: space.md, borderBottomWidth: 1, borderBottomColor: color.rule }}>
                  <Txt variant="bodySm" style={{ width: 92 }}>{`${c.volume} layanan`}</Txt>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}><Txt variant="caption" tone="inkSecondary">Langganan</Txt><Money value={c.subscription} size="sm" /></View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}><Txt variant="caption" tone="inkSecondary">Per layanan</Txt><Money value={c.success} size="sm" /></View>
                </View>
              ))}
            </Sheet>
            <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>Angka ilustratif untuk diskusi; bukan harga final atau bukti kemauan membayar.</Txt>

            {s.usage.length ? (
              <>
                <SectionTitle title="Peristiwa usage" count={s.usage.length} />
                <Sheet>
                  {s.usage.map((u) => (
                    <LineItem key={u.id} label={u.alias} hint={u.note || undefined} value={<View style={{ alignItems: 'flex-end', gap: 2 }}><StatusTag look={usageStatus[u.status]} size="sm" /><Money value={u.amount} size="sm" /></View>} />
                  ))}
                  <Txt variant="caption" tone="inkSecondary">Satu layanan = satu success; handover ulang tidak membuat biaya kedua.</Txt>
                </Sheet>
              </>
            ) : null}

            <SectionTitle title="Preview invoice SaaS" />
            <DocumentStack>
              <Serial>{s.invoicePreview.number}</Serial>
              <Txt variant="bodySm" tone="inkSecondary">{s.invoicePreview.issuer}</Txt>
              <Txt variant="caption" tone="dangerInk" style={{ fontWeight: '700' }}>PREVIEW DEMO · TIDAK DAPAT DIBAYAR · TERPISAH DARI INVOICE JASA</Txt>
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
