import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Line } from 'react-native-svg';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import type { MediaItem } from '@/data/api/contract';
import { locationSourceLabel } from '@/core/i18n/status';
import { t } from '@/core/i18n';

/**
 * Tile bukti foto. Fixture sintetis tidak punya gambar: ditampilkan sebagai pelat bergaris
 * berlabel SIMULASI, bukan foto stok, agar tidak disangka hasil kamera. Foto perangkat memakai thumbnail overlay.
 */
export function PhotoTile({ item, label, onPress, size = 104 }: { item: MediaItem | null; label: string; onPress?: () => void; size?: number }) {
  const c = useColors();
  const styles = useStyles();
  const uri = item?.overlayUri ?? item?.originalUri ?? null;
  const pending = item && (item.status === 'pending_upload' || item.syncStatus === 'pending');
  const a11y = item
    ? t('{0}. {1}. Lokasi: {2}.{3}', [label, item.synthetic ? 'Foto contoh simulasi' : item.captureOrigin === 'camera' ? 'Diambil kamera aplikasi' : 'Diimpor dari galeri', locationSourceLabel[item.locationSource], pending ? ' Belum terkirim.' : ''])
    : t('{0}. Belum ada foto.', [label]);
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : 'image'} accessibilityLabel={a11y} style={({ pressed }) => [{ width: size }, pressed && { opacity: 0.85 }]}>
      <View style={[styles.frame, { width: size, height: size }, !item && styles.empty]}>
        {item && uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={item.id} transition={120} />
        ) : item ? (
          <>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Line key={i} x1={i * 14 - size} y1={size} x2={i * 14} y2={0} stroke={c.line} strokeWidth={1.5} />
              ))}
            </Svg>
            <Icon name="image-outline" size={26} tone="inkSecondary" />
            <Txt variant="caption" tone="inkSecondary" style={{ fontWeight: '700' }} maxFontSizeMultiplier={1.2}>SIMULASI</Txt>
          </>
        ) : (
          <>
            <Icon name="camera-plus-outline" size={26} tone="accentInk" />
            <Txt variant="caption" tone="accentInk" bold maxFontSizeMultiplier={1.2}>Ambil foto</Txt>
          </>
        )}
        {item ? (
          <View style={[styles.badge, pending && styles.badgePending]}>
            <Icon name={pending ? 'cloud-upload-outline' : item.captureOrigin === 'camera' ? 'camera' : 'image-multiple'} size={12} tone="onInverse" />
          </View>
        ) : null}
      </View>
      <Txt variant="caption" tone="inkSecondary" numberOfLines={2} style={{ marginTop: 4 }}>{label}</Txt>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  frame: {
    borderRadius: radius.md,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: c.line,
  },
  empty: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: c.accent, backgroundColor: c.accentSoft },
  badge: { position: 'absolute', right: 6, bottom: 6, backgroundColor: c.inverse, borderRadius: radius.pill, padding: 4 },
  badgePending: { backgroundColor: c.warnInk },
}));

export const PHOTO_GAP = space.sm;
