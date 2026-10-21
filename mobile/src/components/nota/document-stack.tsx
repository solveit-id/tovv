import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { color, radius, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';

const PLY = [color.plyPink, color.plyYellow, color.plyBlue];

/**
 * Gerakan khas "lembar rangkap": dokumen berversi (penawaran, invoice terkoreksi) tampil sebagai
 * lembar aktif di depan dengan tepi lembar lama mengintip di belakangnya. Ketuk tepi untuk membuka riwayat.
 * Jumlah lembar di belakang = jumlah versi sebelumnya; tidak dekoratif.
 */
export function DocumentStack({
  children,
  history,
  historyLabel = 'versi sebelumnya',
}: {
  children: React.ReactNode;
  history?: React.ReactNode[];
  historyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const count = history?.length ?? 0;
  const plies = Math.min(count, 3);
  return (
    <Animated.View layout={LinearTransition.duration(220)}>
      <View style={{ paddingBottom: plies * 5 }}>
        {Array.from({ length: plies }).map((_, i) => {
          const depth = plies - i;
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.ply, { backgroundColor: PLY[i % PLY.length], top: depth * 5, left: depth * 4, right: depth * 4, bottom: 0 }]}
            />
          );
        })}
        <View style={styles.front}>{children}</View>
      </View>
      {count > 0 ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${open ? 'Tutup' : 'Lihat'} ${count} ${historyLabel}`}
          style={({ pressed }) => [styles.toggle, pressed && { backgroundColor: color.carbonTint }]}
        >
          <Icon name={open ? 'chevron-up' : 'file-multiple-outline'} size={18} tone="carbon" />
          <Txt variant="bodySm" tone="carbon" style={{ fontWeight: '600' }}>
            {open ? 'Tutup riwayat' : `${count} ${historyLabel}`}
          </Txt>
        </Pressable>
      ) : null}
      {open ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(140)} style={styles.history}>
          {history}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ply: {
    position: 'absolute',
    borderRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.ruleStrong,
  },
  front: {
    backgroundColor: color.sheet,
    borderRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.ruleStrong,
    padding: space.lg,
    shadowColor: color.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: space.sm, marginTop: space.xs, borderRadius: radius.control },
  history: { gap: space.sm, marginTop: space.xs },
});
