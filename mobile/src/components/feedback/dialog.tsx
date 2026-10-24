import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { radius, space, elevation, type ColorToken } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon, IconTile } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { tr } from '@/core/i18n';

export type DialogTone = 'info' | 'danger' | 'warn' | 'ok' | 'mode';

export interface DialogOptions {
  title: string;
  message?: string;
  /** Poin singkat di bawah pesan (mis. apa yang berubah setelah tombol ditekan). */
  points?: string[];
  icon?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  /** `null` = hanya satu tombol (pemberitahuan). */
  cancelLabel?: string | null;
}

interface Pending extends DialogOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

const TONE: Record<DialogTone, { ink: ColorToken; wash: ColorToken; icon: string; button: 'primary' | 'danger' | 'mode' }> = {
  info: { ink: 'accentInk', wash: 'accentSoft', icon: 'information-outline', button: 'primary' },
  ok: { ink: 'okInk', wash: 'okWash', icon: 'check-circle-outline', button: 'primary' },
  warn: { ink: 'warnInk', wash: 'warnWash', icon: 'alert-outline', button: 'primary' },
  danger: { ink: 'dangerInk', wash: 'dangerWash', icon: 'alert-octagon-outline', button: 'danger' },
  mode: { ink: 'modeAccentInk', wash: 'modeAccentSoft', icon: 'swap-horizontal', button: 'mode' },
};

const DialogContext = createContext<{
  confirm: (o: DialogOptions) => Promise<boolean>;
  inform: (o: DialogOptions) => Promise<void>;
}>({ confirm: async () => false, inform: async () => undefined });

/**
 * Dialog Tovv untuk hal yang butuh keputusan eksplisit (pindah mode, keluar, terbitkan invoice, setujui
 * harga, izin kamera/lokasi) atau pemberitahuan penting. `confirm` mengembalikan true bila tombol utama
 * ditekan; ketuk latar atau Back = batal. Satu dialog tampil sekaligus; berikutnya mengantre.
 */
export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Pending[]>([]);
  const seq = useRef(0);

  const confirm = useCallback(
    (o: DialogOptions) =>
      new Promise<boolean>((resolve) => {
        seq.current += 1;
        const id = seq.current;
        setQueue((q) => [...q, { ...o, id, resolve }]);
      }),
    [],
  );
  const inform = useCallback(async (o: DialogOptions) => {
    await confirm({ confirmLabel: 'Mengerti', ...o, cancelLabel: null });
  }, [confirm]);

  // Ditutup per id: ketukan ganda tidak ikut menjawab dialog berikutnya yang mengantre.
  const closed = useRef(new Set<number>());
  const close = useCallback((d: Pending, ok: boolean) => {
    if (closed.current.has(d.id)) return;
    closed.current.add(d.id);
    d.resolve(ok);
    setQueue((q) => q.filter((x) => x.id !== d.id));
  }, []);

  const value = useMemo(() => ({ confirm, inform }), [confirm, inform]);
  const current = queue[0];
  return (
    <DialogContext.Provider value={value}>
      {children}
      {current ? <DialogView key={current.id} d={current} onClose={close} /> : null}
    </DialogContext.Provider>
  );
}

function DialogView({ d, onClose: closeById }: { d: Pending; onClose: (d: Pending, ok: boolean) => void }) {
  const onClose = (ok: boolean) => closeById(d, ok);
  const s = useStyles();
  const reduced = useReducedMotion();
  const tone = TONE[d.tone ?? 'info'];
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) p.value = withTiming(1, { duration: 200, easing: easeOut });
    if (d.tone === 'danger') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Android tidak selalu membacakan Modal baru; iOS sudah membacakan lewat accessibilityViewIsModal.
    if (Platform.OS === 'android') AccessibilityInfo.announceForAccessibility(tr(d.title));
  }, [p, reduced, d.tone, d.title]);
  const card = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.96 + p.value * 0.04 }] }));
  const single = d.cancelLabel === null;

  return (
    <Modal visible transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => onClose(false)} statusBarTranslucent navigationBarTranslucent>
      <View style={s.center}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose(false)} accessibilityRole="button" accessibilityLabel={tr(single ? (d.confirmLabel ?? 'Mengerti') : (d.cancelLabel ?? 'Batal'))}>
          <View style={[StyleSheet.absoluteFill, s.scrim]} />
        </Pressable>
        <Animated.View style={[s.card, card]} accessibilityViewIsModal>
          {/* Isi bisa digulir bila teks diperbesar atau layar mendatar; tombol tetap terlihat di bawah. */}
          <ScrollView style={s.scroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            <IconTile name={d.icon ?? tone.icon} size={56} tone={tone.ink} wash={tone.wash} shape="circle" />
            <Txt variant="headline" align="center" accessibilityRole="header">{d.title}</Txt>
            {d.message ? <Txt variant="bodySm" tone="inkSecondary" align="center">{d.message}</Txt> : null}
            {d.points?.length ? (
              <View style={s.points}>
                {d.points.map((pt) => (
                  <View key={pt} style={s.point}>
                    <Icon name="check" size={16} tone={tone.ink} />
                    <Txt variant="bodySm" style={{ flex: 1 }}>{pt}</Txt>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
          <View style={s.buttons}>
            <Button label={d.confirmLabel ?? (single ? 'Mengerti' : 'Lanjutkan')} variant={tone.button} size="lg" onPress={() => onClose(true)} />
            {single ? null : <Button label={d.cancelLabel ?? 'Batal'} variant="quiet" onPress={() => onClose(false)} />}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  scrim: { backgroundColor: c.scrim },
  scroll: { alignSelf: 'stretch', flexGrow: 0 },
  body: { alignItems: 'center', gap: space.sm },
  card: { width: '100%', maxWidth: 420, maxHeight: '88%', alignItems: 'center', gap: space.sm, padding: space.xl, paddingTop: space.xxl, borderRadius: radius.xxl, backgroundColor: c.surface, ...elevation(3, c) },
  points: { alignSelf: 'stretch', gap: 6, marginTop: space.xs, padding: space.md, borderRadius: radius.lg, backgroundColor: c.surfaceAlt },
  point: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  buttons: { alignSelf: 'stretch', gap: space.xs, marginTop: space.md },
}));
