import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { color, radius, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { SectionTitle, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { ErrorBlock, LoadingBlock } from '@/components/ui/states';
import { StageLine } from '@/components/nota/stage-line';
import { RouteSchematic } from '@/components/nota/route-schematic';
import { useTovvQuery } from '@/data/api/hooks';
import { executionStatus } from '@/core/i18n/status';
import { formatAge, formatTime, formatDateTime, addMinutes } from '@/core/format/time';
import { useDemoNow } from '@/core/hooks/use-demo-now';

/**
 * Perjalanan untuk pelanggan/owner. ETA didahulukan, lalu identitas unit, lalu tahap. Sumber, umur dan
 * akurasi lokasi selalu terlihat; lebih dari 90 detik = "posisi lama", tidak pernah disebut live.
 */
export function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const focused = useIsFocused();
  const now = useDemoNow(15_000);
  const order = useTovvQuery(['order', id], (a) => a.getOrder(id));
  const t = useTovvQuery(['tracking', id], (a) => a.getTracking(id), { refetchInterval: focused ? 15_000 : false });
  const d = order.data;
  const snap = t.data;

  return (
    <Screen
      onRefresh={async () => {
        await Promise.all([t.refetch(), order.refetch()]);
      }}
      header={<DetailHeader serial={d ? `O-${d.summary.alias}` : undefined} title="Perjalanan" subtitle={d ? `${d.vehicle.label} · ${d.vehicle.plate}` : undefined} />}
      footer={<Button label="Dokumen & bukti pekerjaan" icon="file-document-multiple-outline" variant="secondary" onPress={() => router.push(`/order/${id}`)} />}
    >
      {t.isPending || order.isPending ? <LoadingBlock label="Mengambil posisi terakhir…" /> : t.isError ? <ErrorBlock error={t.error} onRetry={() => void t.refetch()} /> : snap && d ? (
        <>
          <Sheet>
            <StatusTag look={executionStatus[d.summary.status]} />
            {snap.visible && snap.eta ? (
              <View style={styles.eta}>
                <Txt variant="label" tone="inkSecondary">Perkiraan tiba</Txt>
                <View style={styles.etaRow}>
                  <Txt variant="figureLg" style={{ fontSize: 34, lineHeight: 40 }}>{`±${snap.eta.minutes} mnt`}</Txt>
                  <Txt variant="bodySm" tone="inkSecondary">{`sekitar ${formatTime(addMinutes(now, snap.eta.minutes))}`}</Txt>
                </View>
                <Txt variant="caption" tone="inkSecondary">{`${snap.eta.source}. ${snap.eta.warning}`}</Txt>
              </View>
            ) : (
              <Txt variant="body" style={{ marginTop: space.md }}>{snap.hiddenReason ?? 'Lokasi belum tersedia.'}</Txt>
            )}
          </Sheet>

          {snap.visible ? (
            <>
              <View style={[styles.fresh, snap.freshness === 'stale' && styles.stale]} accessibilityRole="text" accessibilityLiveRegion="polite">
                <Icon name={snap.freshness === 'stale' ? 'map-marker-alert-outline' : snap.source === 'device' ? 'crosshairs-gps' : 'play-box-outline'} size={20} tone={snap.freshness === 'stale' ? 'warnInk' : 'carbon'} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" tone={snap.freshness === 'stale' ? 'warnInk' : 'ink'}>
                    {snap.freshness === 'stale' ? 'Posisi lama — bukan posisi saat ini' : snap.source === 'device' ? 'Lokasi dari perangkat petugas' : 'Lokasi simulasi (replay F-06)'}
                  </Txt>
                  <Txt variant="caption" tone="inkSecondary">
                    {`Diperbarui ${snap.capturedAt ? formatAge(snap.capturedAt, now) : '—'} · ${snap.capturedAt ? formatDateTime(snap.capturedAt) : ''} · akurasi ${snap.accuracyM !== null ? `±${snap.accuracyM} m` : 'tidak diketahui'}`}
                  </Txt>
                  {snap.freshness === 'stale' ? (
                    <Txt variant="caption" tone="warnInk">Sinyal atau aplikasi petugas mungkin terputus. Diam bukan berarti kendaraan bermasalah; hubungi operator bila perlu.</Txt>
                  ) : null}
                </View>
              </View>
              <View style={{ marginTop: space.md }}>
                <RouteSchematic
                  pickup={snap.pickup}
                  dropoff={snap.dropoff}
                  position={snap.lat !== null && snap.lng !== null ? { lat: snap.lat, lng: snap.lng } : null}
                  stale={snap.freshness === 'stale'}
                  accuracyM={snap.accuracyM}
                />
              </View>
            </>
          ) : null}

          <SectionTitle title="Unit & petugas" />
          <Sheet style={styles.unit}>
            <View style={styles.unitIcon}>
              <Icon name="tow-truck" size={26} tone="onNavy" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{`Unit ${d.summary.unitCode} · ${d.summary.driverName ?? 'petugas belum ditetapkan'}`}</Txt>
              <Txt variant="bodySm" tone="inkSecondary">{`${d.summary.pickup.label} → ${d.summary.dropoff.label}`}</Txt>
            </View>
          </Sheet>

          <SectionTitle title="Tahap" />
          <Sheet>
            <StageLine entries={d.timeline} />
          </Sheet>
          <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.md }}>
            Lokasi hanya dibagikan dari berangkat ke lokasi jemput sampai tiba di tujuan, dan berhenti saat serah-terima.
          </Txt>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eta: { marginTop: space.md, gap: 2 },
  etaRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.md, flexWrap: 'wrap' },
  fresh: { flexDirection: 'row', gap: space.md, padding: space.md, marginTop: space.md, borderRadius: radius.sheet, backgroundColor: color.carbonTint },
  stale: { backgroundColor: color.warnWash, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.warnInk },
  unit: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  unitIcon: { width: 48, height: 48, borderRadius: radius.control, backgroundColor: color.navy, alignItems: 'center', justifyContent: 'center' },
});
