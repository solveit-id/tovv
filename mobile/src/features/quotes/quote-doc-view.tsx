import React from 'react';
import { View } from 'react-native';
import { space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { LineItem, Money, Rule } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { Stamp } from '@/components/business/stamp';
import { DocumentStack } from '@/components/business/document-stack';
import type { QuoteDoc } from '@/data/api/contract';
import { quoteStatus } from '@/core/i18n/status';
import { formatDateTime, formatShortDateTime, formatTime, formatUntil } from '@/core/format/time';
import { formatBps } from '@/core/format/money';
import { t } from '@/core/i18n';

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
  const styles = useStyles();
  return (
    <View style={{ gap: space.xs }}>
      <View style={styles.head}>
        <View style={{ gap: 4, flex: 1 }}>
          <Txt variant="label" tone="inkSecondary">{t('Penawaran {0} · v{1}', [q.id.replace('Q-', '').replace(/-v\d+$/, ''), q.version])}</Txt>
          <StatusTag look={quoteStatus[q.status]} size="sm" />
        </View>
        {stampFor(q)}
      </View>
      <Txt variant="caption" tone="inkSecondary">{t('Diterbitkan: {0}{1}', [q.operatorName, q.termsVersion ? ` · syarat ${q.termsVersion}` : ''])}</Txt>
      {!compact
        ? q.items.map((it) => <LineItem key={it.label} label={it.label} value={<Money value={it.amount} />} />)
        : null}
      <Rule strong />
      <LineItem label="Total penawaran" emphasis value={<Money value={q.amount} size="lg" />} />
      {q.priority ? (
        <Txt variant="bodySm" tone="inkSecondary">{t('Prioritas: {0}. Kalau janji jadwal tidak terpenuhi: {1}. Bukan janji mengebut di jalan.', [q.priority.commitment, q.priority.failureTerms])}</Txt>
      ) : null}
      <Txt variant="caption" tone="inkSecondary">
        {`${q.unitLabel ?? ''}${q.scheduleStart ? t(' · jadwal {0}–{1}', [formatShortDateTime(q.scheduleStart), formatTime(q.scheduleEnd)]) : ''}`}
      </Txt>
      {q.status === 'sent' ? (
        <Txt variant="bodySm" tone="warnInk" style={{ fontWeight: '600' }}>
          {t('Berlaku sampai {0} ({1}). Penawaran belum memesan unit; unit dikunci setelah disetujui.', [formatDateTime(q.validUntil), formatUntil(q.validUntil, now)])}
        </Txt>
      ) : null}
      {q.assistedConsent ? (
        <Txt variant="caption" tone="inkSecondary">{t('Persetujuan dicatat {0} via {1} · {2}: {3}', [q.assistedConsent.actorName, q.assistedConsent.channel, formatShortDateTime(q.assistedConsent.at), q.assistedConsent.note])}</Txt>
      ) : q.acceptedByName ? (
        <Txt variant="caption" tone="inkSecondary">{t('Disetujui oleh {0}', [q.acceptedByName])}</Txt>
      ) : null}
      {q.rejectedReason ? <Txt variant="caption" tone="dangerInk">{t('Alasan ditolak: {0}', [q.rejectedReason])}</Txt> : null}
      {q.internal && !compact ? (
        <View style={styles.internal}>
          <Txt variant="label" tone="inkSecondary">Internal — tidak terlihat oleh pelanggan</Txt>
          <LineItem label="Biaya langsung (D)" value={<Money value={q.internal.directCost} missingLabel="belum diisi" />} />
          <LineItem label="Kontribusi estimasi" value={<Money value={q.internal.estimate.contribution} missingLabel="belum lengkap" />} />
          <LineItem label="Perkiraan surplus" hint={q.internal.estimate.marginBps !== null ? `margin ${formatBps(q.internal.estimate.marginBps)}` : undefined} value={<Money value={q.internal.estimate.surplus} missingLabel="belum lengkap" />} />
          <LineItem label="Harga target" value={<Money value={q.internal.estimate.targetPrice} missingLabel="belum lengkap" />} />
          <Txt variant="bodySm" tone={q.internal.estimate.certainty === 'meets_target' ? 'okInk' : 'warnInk'} style={{ fontWeight: '600' }}>
            {CERTAINTY[q.internal.estimate.certainty]}
          </Txt>
          {q.internal.belowTargetReason ? <Txt variant="caption" tone="inkSecondary">{t('Alasan harga di bawah target: {0}', [q.internal.belowTargetReason])}</Txt> : null}
        </View>
      ) : null}
    </View>
  );
}

/** Tumpukan versi penawaran: versi terbaru di depan, versi lama di belakang (gerakan khas lembar rangkap). */
export function QuoteStack({ quotes, now }: { quotes: QuoteDoc[]; now: string }) {
  const styles = useStyles();
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

const useStyles = makeStyles((color) => ({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  internal: { marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderStyle: 'dashed', borderColor: color.lineStrong, gap: 2 },
  old: { padding: space.md, borderWidth: 1, borderColor: color.line, borderRadius: 6, backgroundColor: color.surface, opacity: 0.92 },
}));
