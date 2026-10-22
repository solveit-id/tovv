import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { LineItem, SectionTitle, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView, EmptyBlock } from '@/components/ui/states';
import { PhotoTile } from '@/components/business/photo-tile';
import { useTovvQuery } from '@/data/api/hooks';
import type { MediaItem } from '@/data/api/contract';
import { locationSourceLabel, mediaStatus, outboxStatus, stageLabel } from '@/core/i18n/status';
import { formatDateTime } from '@/core/format/time';

function Meta({ m }: { m: MediaItem }) {
  return (
    <Card style={{ marginTop: space.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm }}>
        <StatusTag look={mediaStatus[m.status]} size="sm" />
        {m.syncStatus ? <StatusTag look={outboxStatus[m.syncStatus]} size="sm" /> : null}
      </View>
      <LineItem label="Asal" value={<Txt variant="bodySm">{m.synthetic ? 'Foto contoh SIMULASI (bukan kamera)' : m.captureOrigin === 'camera' ? 'Kamera aplikasi' : 'Impor galeri'}</Txt>} />
      <LineItem label="Waktu kejadian" value={<Txt variant="bodySm">{m.eventAt ? formatDateTime(m.eventAt) : 'Tidak diketahui'}</Txt>} />
      <LineItem label="Jam perangkat saat ambil" value={<Txt variant="bodySm">{m.deviceCapturedAt ? formatDateTime(m.deviceCapturedAt) : '—'}</Txt>} />
      <LineItem label="Diterima server" value={<Txt variant="bodySm">{m.serverReceivedAt ? formatDateTime(m.serverReceivedAt) : 'Belum (tersimpan di ponsel)'}</Txt>} />
      <LineItem label="Lokasi" hint={locationSourceLabel[m.locationSource]} value={<Txt variant="bodySm">{m.latitude !== null && m.longitude !== null ? `${m.latitude.toFixed(5)}, ${m.longitude.toFixed(5)}${m.accuracyM ? ` ±${m.accuracyM} m` : ''}` : 'Tidak tersedia'}</Txt>} />
      <LineItem label="Pengunggah" value={<Txt variant="bodySm">{m.uploaderName}</Txt>} />
      {m.md5 ? <LineItem label="Hash original (MD5)" hint="Memeriksa file sama, bukan kebenaran kejadian" value={<Txt variant="mono">{m.md5.slice(0, 12)}…</Txt>} /> : null}
      {m.note ? <Txt variant="bodySm" tone="inkSecondary">{m.note}</Txt> : null}
    </Card>
  );
}

/** Galeri bukti satu pekerjaan. Pickup vs serah-terima ditampilkan pada skala dan baseline sama untuk dibandingkan. */
export function EvidenceScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const { width } = useWindowDimensions();
  const q = useTovvQuery(['order', id], (a) => a.getOrder(id));
  const tile = Math.min(220, (width - space.lg * 2 - space.md) / 2);
  return (
    <Screen header={<DetailHeader serial={q.data ? `O-${q.data.summary.alias}` : undefined} title="Bukti foto" subtitle="Original privat · overlay untuk dibagikan" />}>
      <QueryView q={q}>
        {(d) => {
          if (!d.media.length) return <EmptyBlock icon="image-off-outline" title="Belum ada bukti" />;
          const pickup = d.media.filter((m) => m.stage === 'pickup_before_loading');
          const delivery = d.media.filter((m) => m.stage === 'delivery_handover');
          const others = d.media.filter((m) => m.stage !== 'pickup_before_loading' && m.stage !== 'delivery_handover');
          const focused = d.media.find((m) => m.id === focus);
          return (
            <>
              {pickup.length && delivery.length ? (
                <>
                  <SectionTitle title="Bandingkan sebelum dan sesudah" />
                  <View style={styles.compare}>
                    <PhotoTile item={pickup[0]!} label={`Sebelum dimuat · ${pickup[0]!.slot}`} size={tile} />
                    <PhotoTile item={delivery[0]!} label={`Serah-terima · ${delivery[0]!.slot}`} size={tile} />
                  </View>
                </>
              ) : null}
              {focused ? (
                <>
                  <SectionTitle title={`${stageLabel[focused.stage]} · ${focused.slot}`} />
                  <PhotoTile item={focused} label="Foto dipilih" size={width - space.lg * 2} />
                  <Meta m={focused} />
                </>
              ) : null}
              {[...pickup, ...delivery, ...others].filter((m) => m.id !== focus).map((m) => (
                <View key={m.id}>
                  <SectionTitle title={`${stageLabel[m.stage]} · ${m.slot}`} />
                  <View style={{ flexDirection: 'row', gap: space.md }}>
                    <PhotoTile item={m} label={m.synthetic ? 'Foto contoh' : 'Foto + keterangan'} size={96} />
                    <View style={{ flex: 1 }}><Meta m={m} /></View>
                  </View>
                </View>
              ))}
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  compare: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
});
