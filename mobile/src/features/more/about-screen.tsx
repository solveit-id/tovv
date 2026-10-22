import React, { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/form';
import { LineItem, SectionTitle, Card } from '@/components/ui/surface';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useApi, useApiState } from '@/data/api/provider';
import { useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { DATASET_GENERATION, DEMO_CLOCK_C0, formatDateTime } from '@/core/format/time';
import { Wordmark } from '@/components/brand/wordmark';

const SOLVEIT_LOGO = require('../../../assets/brand/solveit-logo-full.svg');

/**
 * Tentang & mode demo. Solveit Indonesia tampil sebagai pemilik/pengembang (identitas pendukung).
 * Kendala simulasi memperlihatkan state offline/gagal/penyimpanan penuh tanpa backend.
 */
export function AboutScreen() {
  const color = useColors();
  const api = useApi();
  const { setSession } = useApiState();
  const router = useRouter();
  const toast = useToast();
  const faults = useTovvQuery(['faults'], (a) => a.getFaults());
  const [confirm, setConfirm] = useState(false);
  const f = faults.data;
  const set = async <K extends keyof NonNullable<typeof f>>(k: K, v: NonNullable<typeof f>[K]) => {
    await api.setFault(k, v);
  };
  return (
    <Screen header={<DetailHeader title="Mode demo & tentang" />}>
      <Card>
        <View style={{ backgroundColor: color.heroFrom, padding: space.lg, borderRadius: 6, alignItems: 'flex-start', gap: space.sm }}>
          <Wordmark height={30} />
          <Txt variant="caption" tone="onHeroSecondary">Wordmark sementara — logo resmi Tovv belum tersedia</Txt>
        </View>
        <Txt variant="bodySm" style={{ marginTop: space.md }}>
          Tovv adalah aplikasi pengelolaan operator towing (satu aplikasi multi-tenant untuk owner, admin, driver dan pelanggan). Prototype tahap frontend; semua data sintetis.
        </Txt>
        <View style={{ marginTop: space.lg, gap: space.xs }}>
          <Txt variant="label" tone="inkSecondary">Pemilik, pengembang, dan penerbit</Txt>
          <Image source={SOLVEIT_LOGO} style={{ width: 140, height: 70 }} contentFit="contain" accessibilityLabel="Solveit Indonesia" />
          <Txt variant="bodyStrong">Solveit Indonesia</Txt>
        </View>
      </Card>

      <SectionTitle title="Status data & integrasi" />
      <Card>
        <LineItem label="Sumber data" value={<Txt variant="bodySm">Adapter demo lokal (frontend)</Txt>} />
        <LineItem label="Backend / otorisasi server" value={<Txt variant="bodySm" tone="warnInk">Belum ada (tahap berikutnya)</Txt>} />
        <LineItem label="Pembayaran" value={<Txt variant="bodySm">Manual, simulasi (tidak bisa dibayar)</Txt>} />
        <LineItem label="Peta / ETA" value={<Txt variant="bodySm">Skema simulasi</Txt>} />
        <LineItem label="Lokasi perjalanan" value={<Txt variant="bodySm">Rekaman perjalanan contoh</Txt>} />
        <LineItem label="Kamera & lokasi foto" value={<Txt variant="bodySm">Perangkat bila diizinkan</Txt>} />
        <LineItem label="Push" value={<Txt variant="bodySm">Inbox simulasi</Txt>} />
        <LineItem label="Dataset" value={<Txt variant="mono">{DATASET_GENERATION}</Txt>} />
        <LineItem label="Jam bisnis demo mulai" value={<Txt variant="bodySm">{formatDateTime(DEMO_CLOCK_C0)}</Txt>} />
        <LineItem label="Versi aplikasi" value={<Txt variant="mono">{`${Constants.expoConfig?.version ?? '—'} · SDK ${Constants.expoConfig?.sdkVersion ?? '57'}`}</Txt>} />
      </Card>

      <SectionTitle title="Simulasi kondisi" />
      <Card>
        <Toggle label="Offline" hint="Status/foto/biaya masuk antrean; persetujuan, reservasi, verifikasi ditolak." value={!!f?.offline} onChange={(v) => void set('offline', v)} />
        <Toggle label="Gagal baca berikutnya" hint="Memperlihatkan state gagal + coba lagi." value={!!f?.failNextRead} onChange={(v) => void set('failNextRead', v)} />
        <Toggle label="Penyimpanan penuh" hint="Foto baru ditolak sebelum dinyatakan tersimpan." value={!!f?.lowStorage} onChange={(v) => void set('lowStorage', v)} />
        <Toggle label="Jeda replay lokasi" hint="Posisi berhenti dan menjadi 'lama' setelah 90 detik." value={!!f?.replayPausedAt} onChange={(v) => void set('replayPausedAt', v ? api.now() : null)} />
        <Toggle label="Paket langganan kedaluwarsa" hint="Order baru diblokir; pekerjaan aktif dan pembayaran tetap berjalan." value={!!f?.planExpired} onChange={(v) => void set('planExpired', v)} />
      </Card>

      <Button label="Kembalikan data demo ke awal" icon="restore" variant="danger" onPress={() => setConfirm(true)} style={{ marginTop: space.xxl }} />
      <BottomSheet
        visible={confirm}
        title="Reset data demo?"
        onClose={() => setConfirm(false)}
        footer={
          <Button
            label="Reset sekarang"
            variant="danger"
            onPress={() =>
              void (async () => {
                await api.resetDemo();
                await setSession(null);
                setConfirm(false);
                toast.show('Data demo dikembalikan ke kondisi awal.', 'ok');
                router.replace('/mulai');
              })()
            }
          />
        }
      >
        <Txt variant="body">Semua transaksi demo di perangkat ini kembali ke kondisi awal. Foto yang sudah tersimpan di ponsel tidak dihapus dari penyimpanan aplikasi.</Txt>
      </BottomSheet>
    </Screen>
  );
}
