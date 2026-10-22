import React from 'react';
import { View } from 'react-native';
import { space, stroke } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import type { TimelineEntry } from '@/data/api/contract';
import { formatShortDateTime } from '@/core/format/time';

const RAIL = 28;

/** Ruas putus-putus mengisi tinggi baris tanpa ikut menentukan tingginya. */
function Dashes({ tone }: { tone: string }) {
  const s = useStyles();
  return (
    <View style={s.dashes}>
      <View style={s.dashStack}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[s.dash, { backgroundColor: tone }]} />
        ))}
      </View>
    </View>
  );
}

function Marker({ state }: { state: TimelineEntry['state'] }) {
  const s = useStyles();
  if (state === 'done') {
    return (
      <View style={[s.marker, s.done]}>
        <Icon name="check" size={13} tone="onAccent" />
      </View>
    );
  }
  if (state === 'current') return <View style={[s.marker, s.current]}><View style={s.currentDot} /></View>;
  if (state === 'pending_sync') {
    return (
      <View style={[s.marker, s.pending]}>
        <Icon name="cloud-upload-outline" size={12} tone="warnInk" />
      </View>
    );
  }
  return <View style={[s.marker, s.upcoming]} />;
}

/**
 * Pelacakan tahap perjalanan (gaya pelacakan pesanan): garis utuh = sudah terjadi di server,
 * putus-putus = belum/menunggu sinkron. Label teks selalu ada.
 */
export function StageLine({ entries, tz }: { entries: TimelineEntry[]; tz?: string }) {
  const c = useColors();
  const s = useStyles();
  return (
    <View accessibilityRole="list">
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        const next = entries[i + 1];
        const solid = e.state === 'done' && (next?.state === 'done' || next?.state === 'current');
        const stateText = e.state === 'done' ? 'selesai' : e.state === 'current' ? 'tahap sekarang' : e.state === 'pending_sync' ? 'tersimpan di ponsel, menunggu sinkron' : 'belum';
        return (
          <View key={`${e.status}-${i}`} style={s.row} accessible accessibilityLabel={`${e.label}, ${stateText}${e.at ? `, ${formatShortDateTime(e.at, tz)}` : ''}`}>
            <View style={s.rail}>
              <Marker state={e.state} />
              {!last ? solid ? <View style={s.solid} /> : <Dashes tone={c.lineStrong} /> : null}
            </View>
            <View style={[s.body, last && { paddingBottom: 0 }]}>
              <Txt variant={e.state === 'current' ? 'bodyStrong' : 'body'} tone={e.state === 'upcoming' ? 'inkSecondary' : 'ink'}>
                {e.label}
              </Txt>
              <Txt variant="caption" tone={e.state === 'pending_sync' ? 'warnInk' : e.state === 'current' ? 'accentInk' : 'inkSecondary'}>
                {e.state === 'current' ? `Sedang berlangsung${e.at ? ` · sejak ${formatShortDateTime(e.at, tz)}` : ''}` : e.state === 'pending_sync' ? 'Tersimpan di ponsel · menunggu dikirim' : e.at ? formatShortDateTime(e.at, tz) : 'Belum'}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Versi ringkas untuk kartu daftar: satu ruas per tahap. */
export function StageTicks({ entries }: { entries: TimelineEntry[] }) {
  const s = useStyles();
  const done = entries.filter((e) => e.state === 'done').length;
  const cur = entries.find((e) => e.state === 'current');
  return (
    <View style={s.ticks} accessible accessibilityLabel={`Tahap ${done + (cur ? 1 : 0)} dari ${entries.length}${cur ? `: ${cur.label}` : ''}`}>
      {entries.map((e, i) => (
        <View key={i} style={[s.tick, e.state === 'done' && s.tickDone, e.state === 'current' && s.tickCurrent, e.state === 'pending_sync' && s.tickPending]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', gap: space.md },
  rail: { width: RAIL, alignItems: 'center' },
  marker: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: c.accent },
  current: { borderWidth: stroke.stage, borderColor: c.accent, backgroundColor: c.surface, width: 26, height: 26, borderRadius: 13, marginHorizontal: -2 },
  currentDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
  pending: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.warnInk, backgroundColor: c.warnWash },
  upcoming: { borderWidth: 2, borderColor: c.lineStrong, backgroundColor: c.surface },
  solid: { flex: 1, width: stroke.stage, backgroundColor: c.accent, minHeight: 18, borderRadius: 2 },
  dashes: { flex: 1, minHeight: 18, width: 4, overflow: 'hidden' },
  dashStack: { position: 'absolute', top: 3, left: 1, gap: 4 },
  dash: { width: 2, height: 5, borderRadius: 1 },
  body: { flex: 1, paddingBottom: space.lg, paddingTop: 1 },
  ticks: { flexDirection: 'row', gap: 4 },
  tick: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.line },
  tickDone: { backgroundColor: c.accent },
  // Tahap sekarang sudah tercapai: terisi, dengan tepi lebih terang agar beda dari tahap sebelumnya.
  tickCurrent: { backgroundColor: c.accent },
  tickPending: { backgroundColor: c.warnWash, borderColor: c.warnInk, borderWidth: 1.5, borderStyle: 'dashed' },
}));
