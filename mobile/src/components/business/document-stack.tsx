import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';

/**
 * Dokumen berversi (penawaran, invoice terkoreksi): versi aktif di depan, versi lama tampil sebagai
 * kartu bertumpuk di belakangnya (maksimal 3, sejumlah versi sebelumnya — tidak dekoratif).
 * Ketuk "N versi sebelumnya" untuk membuka riwayat.
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
  const s = useStyles();
  const [open, setOpen] = useState(false);
  const count = history?.length ?? 0;
  const plies = Math.min(count, 3);
  return (
    <Animated.View layout={LinearTransition.duration(240)}>
      <View style={{ paddingTop: plies * 6 }}>
        {Array.from({ length: plies }).map((_, i) => {
          const depth = plies - i;
          return <View key={i} pointerEvents="none" style={[s.ply, { top: (plies - depth) * 6, left: depth * 8, right: depth * 8, opacity: 1 - depth * 0.18 }]} />;
        })}
        <View style={s.front}>{children}</View>
      </View>
      {count > 0 ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${open ? 'Tutup' : 'Lihat'} ${count} ${historyLabel}`}
          style={({ pressed }) => [s.toggle, pressed && s.togglePressed]}
        >
          <Icon name={open ? 'chevron-up' : 'history'} size={18} tone="accentInk" />
          <Txt variant="bodySm" tone="accentInk" style={{ fontWeight: '700' }}>
            {open ? 'Tutup riwayat' : `${count} ${historyLabel}`}
          </Txt>
        </Pressable>
      ) : null}
      {open ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(140)} style={s.history}>
          {history}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  ply: { position: 'absolute', height: 40, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  front: { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, ...cardChrome(c, scheme, 2) },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: space.md, marginTop: space.sm, borderRadius: radius.pill, backgroundColor: c.accentSoft },
  togglePressed: { opacity: 0.8 },
  history: { gap: space.sm, marginTop: space.sm },
}));
