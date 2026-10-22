import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, space, stroke } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import type { TimelineEntry } from '@/data/api/contract';
import { formatShortDateTime } from '@/core/format/time';

const RAIL = 28;

/** Ruas putus-putus mengisi tinggi baris tanpa ikut menentukan tingginya. */
function Dashes({ tone }: { tone: string }) {
  return (
    <View style={styles.dashes}>
      <View style={styles.dashStack}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[styles.dash, { backgroundColor: tone }]} />
        ))}
      </View>
    </View>
  );
}

function Marker({ state }: { state: TimelineEntry['state'] }) {
  if (state === 'done') {
    return (
      <View style={[styles.marker, styles.done]}>
        <Icon name="check" size={13} tone="onNavy" />
      </View>
    );
  }
  if (state === 'current') return <View style={[styles.marker, styles.current]}><View style={styles.currentDot} /></View>;
  if (state === 'pending_sync') {
    return (
      <View style={[styles.marker, styles.pending]}>
        <Icon name="cloud-upload-outline" size={12} tone="warnInk" />
      </View>
    );
  }
  return <View style={[styles.marker, styles.upcoming]} />;
}

/**
 * Garis tahap perjalanan dengan stasiun berjarak tetap (raise dari diagram transit):
 * garis utuh = sudah terjadi di server, putus-putus = belum/menunggu sinkron. Label teks selalu ada.
 */
export function StageLine({ entries, tz }: { entries: TimelineEntry[]; tz?: string }) {
  return (
    <View accessibilityRole="list">
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        const next = entries[i + 1];
        const solid = e.state === 'done' && (next?.state === 'done' || next?.state === 'current');
        const stateText = e.state === 'done' ? 'selesai' : e.state === 'current' ? 'tahap sekarang' : e.state === 'pending_sync' ? 'tersimpan di ponsel, menunggu sinkron' : 'belum';
        return (
          <View key={`${e.status}-${i}`} style={styles.row} accessible accessibilityLabel={`${e.label}, ${stateText}${e.at ? `, ${formatShortDateTime(e.at, tz)}` : ''}`}>
            <View style={styles.rail}>
              <Marker state={e.state} />
              {!last ? solid ? <View style={styles.solid} /> : <Dashes tone={color.ruleStrong} /> : null}
            </View>
            <View style={[styles.body, last && { paddingBottom: 0 }]}>
              <Txt variant={e.state === 'current' ? 'bodyStrong' : 'body'} tone={e.state === 'upcoming' ? 'inkSecondary' : 'ink'}>
                {e.label}
              </Txt>
              <Txt variant="caption" tone={e.state === 'pending_sync' ? 'warnInk' : 'inkSecondary'}>
                {e.state === 'current' ? `Sekarang${e.at ? ` · sejak ${formatShortDateTime(e.at, tz)}` : ''}` : e.state === 'pending_sync' ? 'Tersimpan di ponsel · menunggu sinkron' : e.at ? formatShortDateTime(e.at, tz) : 'Belum'}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Versi ringkas untuk daftar: satu ruas per tahap. */
export function StageTicks({ entries }: { entries: TimelineEntry[] }) {
  const done = entries.filter((e) => e.state === 'done').length;
  const cur = entries.find((e) => e.state === 'current');
  return (
    <View style={styles.ticks} accessible accessibilityLabel={`Tahap ${done + (cur ? 1 : 0)} dari ${entries.length}${cur ? `: ${cur.label}` : ''}`}>
      {entries.map((e, i) => (
        <View
          key={i}
          style={[
            styles.tick,
            e.state === 'done' && { backgroundColor: color.carbon },
            e.state === 'current' && { backgroundColor: color.sheet, borderColor: color.carbon, borderWidth: 2 },
            e.state === 'pending_sync' && { backgroundColor: color.warnWash, borderColor: color.warnInk, borderWidth: 1.5, borderStyle: 'dashed' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  rail: { width: RAIL, alignItems: 'center' },
  marker: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: color.carbon },
  current: { borderWidth: stroke.stage, borderColor: color.carbon, backgroundColor: color.sheet, width: 26, height: 26, borderRadius: 13, marginHorizontal: -2 },
  currentDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.carbon },
  pending: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.warnInk, backgroundColor: color.warnWash },
  upcoming: { borderWidth: 2, borderColor: color.ruleStrong, backgroundColor: color.sheet },
  solid: { flex: 1, width: stroke.stage, backgroundColor: color.carbon, minHeight: 18 },
  dashes: { flex: 1, minHeight: 18, width: 4, overflow: 'hidden' },
  dashStack: { position: 'absolute', top: 3, left: 1, gap: 4 },
  dash: { width: 2, height: 5, borderRadius: 1 },
  body: { flex: 1, paddingBottom: space.lg, paddingTop: 1 },
  ticks: { flexDirection: 'row', gap: 3 },
  tick: { flex: 1, height: 6, borderRadius: 2, backgroundColor: color.rule },
});
