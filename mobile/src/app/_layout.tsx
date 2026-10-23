import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeModeScope, ThemeProvider, useTheme } from '@/core/design/theme';
import { ApiProvider, useApiState, useSession } from '@/data/api/provider';
import { useLocale } from '@/core/i18n';
import { ToastProvider } from '@/components/feedback/toast';
import { DemoStrip } from '@/components/layout/demo-strip';
import { SplashOverlay } from '@/components/feedback/splash-overlay';
import { ModeSwitchOverlay } from '@/components/feedback/mode-switch-overlay';
import { useReducedMotion } from '@/core/design/motion';

void SplashScreen.preventAutoHideAsync();

/**
 * Saat bahasa diganti, layar dibangun ulang dan data dimuat ulang supaya teks dari data (alasan, status,
 * langkah berikutnya) ikut berganti bahasa. Navigasi kembali ke beranda peran.
 */
function LocaleBoundary({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { queryClient } = useApiState();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    queryClient.clear();
  }, [locale, queryClient]);
  return <React.Fragment key={locale}>{children}</React.Fragment>;
}

/** Mode driver memakai palet lapangan (header biru-arang + aksen kuning); peran lain memakai biru merek. */
function SessionThemeScope({ children }: { children: React.ReactNode }) {
  const session = useSession();
  return <ThemeModeScope mode={session?.view === 'driver' ? 'field' : 'brand'}>{children}</ThemeModeScope>;
}

/** Transisi halaman: dorong dari kanan dengan parallax (gaya iOS) di kedua OS; back gesture tetap native. */
const PUSH = Platform.OS === 'android' ? 'ios_from_right' : 'default';

function Shell() {
  const { c } = useTheme();
  // "Kurangi gerakan": pergantian halaman tanpa animasi geser.
  const reduced = useReducedMotion();
  const push = reduced ? 'none' : PUSH;
  const fade = reduced ? 'none' : 'fade';
  const sheet = reduced ? 'none' : 'slide_from_bottom';
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg);
  }, [c.bg]);
  // Splash native segera diganti splash beranimasi (SplashOverlay) yang menutupi pemuatan data demo.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <ToastProvider>
        <ApiProvider fallback={<View style={{ flex: 1, backgroundColor: c.heroFrom }} />}>
          {/* Pita DEMO kuning ada di bawah status bar pada kedua tema, jadi ikon status bar selalu gelap. */}
          <StatusBar style="dark" />
          <LocaleBoundary>
            <SessionThemeScope>
              <View style={{ flex: 1 }}>
                <DemoStrip />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: push, animationDuration: 300 }}>
                  <Stack.Screen name="index" options={{ animation: fade }} />
                  <Stack.Screen name="auth/login" options={{ animation: fade }} />
                  <Stack.Screen name="owner" options={{ animation: fade }} />
                  <Stack.Screen name="driver" options={{ animation: fade }} />
                  <Stack.Screen name="customer" options={{ animation: fade }} />
                  <Stack.Screen name="demo" options={{ animation: sheet }} />
                  <Stack.Screen name="camera" options={{ animation: sheet, gestureEnabled: false }} />
                </Stack>
              </View>
              <ModeSwitchOverlay />
            </SessionThemeScope>
          </LocaleBoundary>
        </ApiProvider>
      </ToastProvider>
      <SplashOverlay />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
