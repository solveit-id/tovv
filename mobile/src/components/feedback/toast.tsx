import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';

type Tone = 'ok' | 'danger' | 'info';
interface ToastMsg {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<{ show: (text: string, tone?: Tone) => void }>({ show: () => undefined });
export const useToast = () => useContext(ToastContext);

/** Snackbar hasil tindakan di bawah pita DEMO, agar tidak menutupi tombol aksi utama di area ibu jari. Diumumkan ke pembaca layar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((text: string, tone: Tone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, tone });
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMsg(null), tone === 'danger' ? 5500 : 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {msg ? (
        <Animated.View key={msg.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)} style={[styles.wrap, { top: insets.top + 36 }]} pointerEvents="box-none">
          <Pressable onPress={() => setMsg(null)} accessibilityRole="alert" accessibilityLabel={msg.text} style={[styles.toast, msg.tone === 'danger' && styles.danger, msg.tone === 'ok' && styles.ok]}>
            <Icon name={msg.tone === 'danger' ? 'alert-circle-outline' : msg.tone === 'ok' ? 'check-circle-outline' : 'information-outline'} tone="onNavy" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodySm" tone="onNavy">{msg.text}</Txt>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  toast: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    backgroundColor: color.navy,
    borderRadius: radius.control,
    padding: space.md,
    shadowColor: color.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ok: { backgroundColor: color.okInk },
  danger: { backgroundColor: color.dangerInk },
});
