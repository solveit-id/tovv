import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { LineItem, Money, Rule, Serial } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { Stamp } from '@/components/nota/stamp';
import { DocumentStack } from '@/components/nota/document-stack';
import type { QuoteDoc } from '@/data/api/contract';
import { quoteStatus } from '@/core/i18n/status';
import { formatDateTime, formatShortDateTime, formatTime, formatUntil } from '@/core/format/time';
import { formatBps } from '@/core/format/money';

const CERTAINTY = {
  incomplete: 'Biaya belum lengkap — tidak dapat disebut pasti untung',
  loss: 'Di bawah biaya: surplus negatif',
  below_target: 'Di bawah harga target',
  meets_target: 'Memenuhi harga target',
} as const;

function stampFor(q: QuoteDoc) {
  if (q.status === 'accepted') return <Stamp label="DISETUJUI" tone="ok" detail={q.acceptedAt ? formatShortDateTime(q.acceptedAt) : undefined} />;
  if (q.status === 'rejected') return <Stamp label="DITOLAK" tone="danger" />;
  if (q.status === 'superseded') return <Stamp label="DIGANTI" tone="neutral" />;
  if (q.status === 'expired') return <Stamp label="KEDALUWARSA" tone="neutral" />;
  return null;
}

/** Satu lembar penawaran. Bagian internal (biaya, target) hanya ada bila DTO membawanya (staf). */
export function QuoteSheet({ q, now, compact }: { q: QuoteDoc; now: string; compact?: boolean }) {
  return (
    <View style={{ gap: space.xs }}>
      <View style={styles.head}>
        <View style={{ gap: 4, flex: 1 }}>
          <Serial>{`PENAWARAN ${q.id.replace('Q-', '').replace(/-v\d+$/, '')} · v${q.version}`}</Serial>
          <StatusTag look={quoteStatus[q.status]} size="sm" />
        </View>
        {stampFor(q)}
      </View>
      <Txt variant="caption" tone="inkSecondary">{`Penerbit: ${q.operatorName}${q.termsVersion ? ` · syarat ${q.termsVersion}` : ''}`}</Txt>
      {!compact
        ? q.items.map((it) => <LineItem key={it.label} label={it.label} value={<Money value={it.amount} />} />)
        : null}
      <Rule strong />
      <LineItem label="Total penawaran" emphasis value={<Money value={q.amount} size="lg" />} />
      {q.priority ? (
        <Txt variant="bodySm" tone="inkSecondary">{`Prioritas: ${q.priority.commitment}. Bila komitmen gagal: ${q.priority.failureTerms}. Bukan janji kecepatan berkendara.`}</Txt>
      ) : null}
      <Txt variant="caption" tone="inkSecondary">
        {`${q.unitLabel ?? ''}${q.scheduleStart ? ` · jadwal ${formatShortDateTime(q.scheduleStart)}–${formatTime(q.scheduleEnd)}` : ''}`}
      </Txt>
      {q.status === 'sent' ? (
        <Txt variant="bodySm" tone="warnInk" style={{ fontWeight: '600' }}>
          {`Berlaku sampai ${formatDateTime(q.validUntil)} (${formatUntil(q.validUntil, now)}). Penawaran tidak menahan slot; unit dikunci saat disetujui.`}
        </Txt>
      ) : null}
      {q.assistedConsent ? (
        <Txt variant="caption" tone="inkSecondary">{`Persetujuan dicatat ${q.assistedConsent.actorName} via ${q.assistedConsent.channel} · ${formatShortDateTime(q.assistedConsent.at)}: ${q.assistedConsent.note}`}</Txt>
      ) : q.acceptedByName ? (
        <Txt variant="caption" tone="inkSecondary">{`Disetujui oleh ${q.acceptedByName}`}</Txt>
      ) : null}
      {q.rejectedReason ? <Txt variant="caption" tone="dangerInk">{`Alasan ditolak: ${q.rejectedReason}`}</Txt> : null}
      {q.internal && !compact ? (
        <View style={styles.internal}>
          <Txt variant="label" tone="inkSecondary">Internal — tidak tampil ke pelanggan</Txt>
          <LineItem label="Biaya langsung (D)" value={<Money value={q.internal.directCost} missingLabel="belum diisi" />} />
          <LineItem label="Kontribusi estimasi" value={<Money value={q.internal.estimate.contribution} missingLabel="belum lengkap" />} />
          <LineItem label="Surplus estimasi" hint={q.internal.estimate.marginBps !== null ? `margin ${formatBps(q.internal.estimate.marginBps)}` : undefined} value={<Money value={q.internal.estimate.surplus} missingLabel="belum lengkap" />} />
          <LineItem label="Harga target" value={<Money value={q.internal.estimate.targetPrice} missingLabel="belum lengkap" />} />
          <Txt variant="bodySm" tone={q.internal.estimate.certainty === 'meets_target' ? 'okInk' : 'warnInk'} style={{ fontWeight: '600' }}>
            {CERTAINTY[q.internal.estimate.certainty]}
          </Txt>
          {q.internal.belowTargetReason ? <Txt variant="caption" tone="inkSecondary">{`Alasan harga di bawah target: ${q.internal.belowTargetReason}`}</Txt> : null}
        </View>
      ) : null}
    </View>
  );
}

/** Tumpukan versi penawaran: versi terbaru di depan, versi lama di belakang (gerakan khas lembar rangkap). */
export function QuoteStack({ quotes, now }: { quotes: QuoteDoc[]; now: string }) {
  const [latest, ...older] = quotes;
  if (!latest) return null;
  return (
    <DocumentStack
      historyLabel="versi penawaran sebelumnya"
      history={older.map((q) => (
        <View key={q.id} style={styles.old}>
          <QuoteSheet q={q} now={now} compact />
        </View>
      ))}
    >
      <QuoteSheet q={latest} now={now} />
    </DocumentStack>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  internal: { marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderStyle: 'dashed', borderColor: color.ruleStrong, gap: 2 },
  old: { padding: space.md, borderWidth: 1, borderColor: color.rule, borderRadius: 6, backgroundColor: color.sheet, opacity: 0.92 },
});
