import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, elevation, type ColorToken } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { IconTile } from '@/components/ui/icon';

type Tone = 'ok' | 'danger' | 'info';
interface ToastMsg {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<{ show: (text: string, tone?: Tone) => void }>({ show: () => undefined });
export const useToast = () => useContext(ToastContext);

const LOOK: Record<Tone, { icon: string; ink: ColorToken; wash: ColorToken }> = {
  ok: { icon: 'check', ink: 'okInk', wash: 'okWash' },
  danger: { icon: 'alert-circle-outline', ink: 'dangerInk', wash: 'dangerWash' },
  info: { icon: 'information-variant', ink: 'accentInk', wash: 'accentSoft' },
};

/** Snackbar hasil tindakan di bawah pita DEMO, agar tidak menutupi tombol aksi utama di area ibu jari. Diumumkan ke pembaca layar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const s = useStyles();

  const show = useCallback((text: string, tone: Tone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, tone });
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMsg(null), tone === 'danger' ? 5500 : 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const look = msg ? LOOK[msg.tone] : null;
  // Nilai konteks stabil: hook yang bergantung pada toast (mis. usePermission) tidak berganti identitas tiap toast tampil.
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {msg && look ? (
        <Animated.View key={msg.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)} style={[s.wrap, { top: insets.top + 44 }]} pointerEvents="box-none">
          <Pressable onPress={() => setMsg(null)} accessibilityRole="alert" accessibilityLabel={msg.text} style={s.toast}>
            <IconTile name={look.icon} size={32} tone={look.ink} wash={look.wash} shape="circle" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodySm" tone="onInverse" style={{ fontWeight: '500' }}>{msg.text}</Txt>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  toast: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    backgroundColor: c.inverse,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    ...elevation(3, c),
  },
}));
