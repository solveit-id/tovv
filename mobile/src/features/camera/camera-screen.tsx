import React, { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeBack } from '@/core/hooks/use-safe-back';
import { color, radius, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Field, Choice } from '@/components/ui/form';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { useApi } from '@/data/api/provider';
import { useTovvQuery, errorMessage } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import type { CaptureOrigin, MediaStage } from '@/domain/types';
import { stageLabel, locationSourceLabel } from '@/core/i18n/status';
import { formatAge, formatDateTime } from '@/core/format/time';
import { readCaptureLocation, type CaptureLocation } from './location-adapter';
import { persistDerivative, persistOriginal, StorageFullError } from './durable-media';

type Phase = 'capture' | 'preview' | 'saving';

interface Shot {
  uri: string;
  origin: CaptureOrigin;
  deviceCapturedAt: string | null;
  width: number;
  height: number;
}

/**
 * GPS Map Camera (CAM-01–CAM-05). Kamera dalam aplikasi → pratinjau/retake/catatan → original disalin ke
 * penyimpanan permanen → overlay derivative (DEMO, waktu+zona, lokasi/sumber, ref, tahap) → antrean upload.
 * Galeri selalu berlabel impor. Lokasi yang tidak ada ditulis "lokasi tidak tersedia", tidak dikarang.
 */
export function CameraScreen() {
  const p = useLocalSearchParams<{ requestId: string; orderId?: string; stage: MediaStage; slot: string }>();
  const goBack = useSafeBack(p.orderId ? `/order/${p.orderId}` : `/request/${p.requestId}`);
  const api = useApi();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const overlayRef = useRef<View>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('capture');
  const [shot, setShot] = useState<Shot | null>(null);
  const [loc, setLoc] = useState<CaptureLocation | null>(null);
  const [manual, setManual] = useState<'none' | 'pickup' | 'dropoff'>('none');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const req = useTovvQuery(['capture-context', p.requestId], (a) => a.getCaptureContext(p.requestId));
  const now = api.now();

  // Izin kamera ditanya sekali saat layar dibuka; bila ditolak, layar penjelasan + alternatif ditampilkan.
  useEffect(() => {
    if (perm && !perm.granted && perm.canAskAgain && perm.status === 'undetermined') void requestPerm();
  }, [perm, requestPerm]);

  useEffect(() => {
    let alive = true;
    void readCaptureLocation().then((l) => alive && setLoc(l));
    return () => {
      alive = false;
    };
  }, []);

  const effectiveLoc = (): CaptureLocation => {
    if (manual !== 'none' && req.data) {
      const place = manual === 'pickup' ? req.data.pickup : req.data.dropoff;
      return { latitude: place.lat, longitude: place.lng, accuracyM: null, capturedAt: null, source: 'manual', note: `Titik manual: ${place.label}` };
    }
    return loc ?? { latitude: null, longitude: null, accuracyM: null, capturedAt: null, source: 'unknown', note: 'Lokasi masih dicari' };
  };

  const take = async () => {
    setError(null);
    try {
      const pic = await camRef.current?.takePictureAsync({ quality: 0.92, exif: false, skipProcessing: false });
      if (!pic) return;
      setShot({ uri: pic.uri, origin: 'camera', deviceCapturedAt: new Date().toISOString(), width: pic.width, height: pic.height });
      setPhase('preview');
    } catch (e) {
      setError(`Kamera gagal mengambil foto: ${errorMessage(e)}`);
    }
  };

  const importGallery = async () => {
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false, allowsEditing: false });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    // EXIF galeri tidak dipercaya: waktu ambil tidak diketahui (null), bukan diganti waktu impor.
    setShot({ uri: a.uri, origin: 'gallery', deviceCapturedAt: null, width: a.width, height: a.height });
    setPhase('preview');
  };

  const save = async () => {
    if (!shot || !req.data) return;
    setPhase('saving');
    setError(null);
    const clientMediaId = `cam-${req.data.alias}-${p.slot}-${Date.now()}`;
    const l = effectiveLoc();
    try {
      const original = persistOriginal(shot.uri, clientMediaId);
      let overlayUri: string | null = null;
      try {
        const tmp = await captureRef(overlayRef, { format: 'jpg', quality: 0.82, result: 'tmpfile' });
        overlayUri = persistDerivative(tmp, clientMediaId);
      } catch {
        overlayUri = null; // original tetap aman; overlay dapat dibuat ulang
      }
      await api.captureMedia({
        requestId: req.data.id,
        orderId: p.orderId || null,
        stage: p.stage,
        slot: p.slot,
        captureOrigin: shot.origin,
        eventAt: shot.deviceCapturedAt,
        deviceCapturedAt: shot.deviceCapturedAt,
        deviceRecordedAt: new Date().toISOString(),
        locationCapturedAt: l.capturedAt,
        latitude: l.latitude,
        longitude: l.longitude,
        accuracyM: l.accuracyM,
        locationSource: l.source,
        note: [note.trim(), l.note].filter(Boolean).join(' · '),
        originalUri: original.uri,
        overlayUri,
        md5: original.md5,
        byteSize: original.size,
        clientMediaId,
      });
      toast.show(overlayUri ? 'Foto tersimpan di ponsel. Menunggu dikirim (lihat Sinkron).' : 'Original tersimpan; overlay gagal dibuat dan akan dicoba ulang.', 'ok');
      goBack();
    } catch (e) {
      setPhase('preview');
      setError(e instanceof StorageFullError ? `${e.message} Kosongkan ruang lalu coba lagi; foto lain yang menunggu tidak dihapus.` : errorMessage(e));
    }
  };

  const header = <DetailHeader title={`Foto · ${stageLabel[p.stage] ?? 'bukti'}`} subtitle={req.data ? `${req.data.alias} · ${req.data.vehicle.label} ${req.data.vehicle.plate} · slot ${p.slot}` : undefined} />;

  if (!perm) return <Screen header={header}><Txt variant="body">Memeriksa izin kamera…</Txt></Screen>;

  if (!perm.granted && phase === 'capture') {
    return (
      <Screen header={header}>
        <View style={styles.denied}>
          <Icon name="camera-off-outline" size={36} tone="warnInk" />
          <Txt variant="headline" align="center">Kamera belum diizinkan</Txt>
          <Txt variant="body" tone="inkSecondary" align="center">
            Tovv memakai kamera untuk foto kondisi kendaraan. Tanpa izin, Anda tetap dapat mengimpor dari galeri (diberi label impor) atau melanjutkan dengan catatan.
          </Txt>
          {perm.canAskAgain ? <Button label="Izinkan kamera" icon="camera-outline" onPress={() => void requestPerm()} /> : <Button label="Buka pengaturan" icon="cog-outline" onPress={() => void Linking.openSettings()} />}
          <Button label="Impor dari galeri" icon="image-multiple-outline" variant="secondary" onPress={() => void importGallery()} />
          <Button label="Kembali tanpa foto" variant="quiet" onPress={() => goBack()} />
        </View>
      </Screen>
    );
  }

  const l = effectiveLoc();
  const locText = l.latitude !== null && l.longitude !== null ? `${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)}` : 'lokasi tidak tersedia';

  if (phase !== 'capture' && shot) {
    const aspect = shot.width && shot.height ? shot.width / shot.height : 3 / 4;
    return (
      <Screen
        header={header}
        footer={
          <>
            {error ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{error}</Txt> : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Ulangi" icon="camera-retake-outline" variant="secondary" style={{ flex: 1 }} disabled={phase === 'saving'} onPress={() => { setShot(null); setPhase('capture'); }} />
              <Button label="Simpan foto" icon="content-save-outline" size="lg" style={{ flex: 2 }} loading={phase === 'saving'} onPress={() => void save()} />
            </View>
          </>
        }
      >
        <View ref={overlayRef} collapsable={false} style={[styles.preview, { aspectRatio: aspect }]}>
          <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.overlay} accessible accessibilityLabel={`Overlay: DEMO, ${shot.origin === 'gallery' ? 'impor galeri' : 'kamera aplikasi'}, ${locText}, sumber ${locationSourceLabel[l.source]}`}>
            <Txt variant="caption" tone="onNavy" style={styles.ovBold} maxFontSizeMultiplier={1}>{`DEMO · TOVV · ${shot.origin === 'gallery' ? 'IMPOR GALERI' : 'KAMERA APLIKASI'}`}</Txt>
            <Txt variant="caption" tone="onNavy" maxFontSizeMultiplier={1}>
              {shot.deviceCapturedAt ? `${formatDateTime(shot.deviceCapturedAt)} · jam perangkat · Asia/Jakarta` : 'Waktu ambil tidak diketahui (galeri)'}
            </Txt>
            <Txt variant="caption" tone="onNavy" maxFontSizeMultiplier={1}>
              {`${locText} · ${locationSourceLabel[l.source]}${l.accuracyM !== null ? ` ±${l.accuracyM} m` : ''}${l.source === 'stale' && l.capturedAt ? ` · ${formatAge(l.capturedAt, now)}` : ''}`}
            </Txt>
            <Txt variant="caption" tone="onNavy" maxFontSizeMultiplier={1}>{`${req.data?.alias ?? ''}${p.orderId ? ` · ${p.orderId}` : ''} · ${stageLabel[p.stage] ?? p.stage}`}</Txt>
          </View>
        </View>
        <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.sm }}>
          Original disimpan tanpa overlay dan tanpa kompresi; overlay di atas adalah salinan terpisah. Hash memeriksa file sama, bukan kebenaran kejadian.
        </Txt>
        <View style={{ marginTop: space.lg }}>
          <Field label="Catatan kondisi" value={note} onChangeText={setNote} multiline placeholder="mis. baret di bumper kiri belakang" />
          {(l.source === 'unknown' || manual !== 'none') && req.data ? (
            <Choice
              label="Lokasi"
              value={manual}
              onChange={setManual}
              helper="Titik manual diberi label manual dan tanpa akurasi GPS."
              options={[
                { value: 'none', label: 'Biarkan tidak tersedia' },
                { value: 'pickup', label: `Manual: ${req.data.pickup.label}` },
                { value: 'dropoff', label: `Manual: ${req.data.dropoff.label}` },
              ]}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.camRoot}>
      {header}
      <View style={{ flex: 1 }}>
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} onMountError={(e) => setError(`Kamera tidak dapat dibuka: ${e.message}`)} />
        <View style={styles.locChip} accessibilityLiveRegion="polite">
          <Icon name={l.source === 'device' ? 'crosshairs-gps' : l.source === 'stale' ? 'map-marker-alert-outline' : 'map-marker-off-outline'} size={16} tone="onNavy" />
          <Txt variant="caption" tone="onNavy" maxFontSizeMultiplier={1.3}>
            {loc ? `${locationSourceLabel[l.source]}${l.accuracyM !== null ? ` ±${l.accuracyM} m` : ''}` : 'Mencari lokasi… (foto tetap bisa diambil)'}
          </Txt>
        </View>
      </View>
      <View style={[styles.controls, { paddingBottom: insets.bottom + space.lg }]}>
        {error ? <Txt variant="bodySm" tone="onNavy" align="center">{error}</Txt> : null}
        <View style={styles.controlRow}>
          <Button label="Galeri" icon="image-multiple-outline" variant="onNavy" compact onPress={() => void importGallery()} />
          <Button label="Ambil foto" icon="camera" size="lg" disabled={!ready} onPress={() => void take()} style={{ flex: 1 }} />
        </View>
        <Txt variant="caption" tone="onNavySecondary" align="center">{`Kamera DEMO · ${req.data?.vehicle.plate ?? ''}`}</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camRoot: { flex: 1, backgroundColor: color.cameraGround },
  denied: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  preview: { width: '100%', borderRadius: radius.sheet, overflow: 'hidden', backgroundColor: color.navy },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.sm, backgroundColor: color.overlayInk, gap: 1 },
  ovBold: { fontWeight: '700', letterSpacing: 0.4 },
  locChip: { position: 'absolute', top: space.md, left: space.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color.overlayInk, paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.cell },
  controls: { backgroundColor: color.navy, paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm },
  controlRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
});

