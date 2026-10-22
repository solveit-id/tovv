import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/core/design/theme';
import { ApiProvider } from '@/data/api/provider';
import { ToastProvider } from '@/components/feedback/toast';
import { DemoStrip } from '@/components/layout/demo-strip';
import { BootScreen } from '@/features/identity/boot-screen';

void SplashScreen.preventAutoHideAsync();

function Ready({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return <>{children}</>;
}

function Shell() {
  const { c } = useTheme();
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg);
  }, [c.bg]);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <ToastProvider>
        <ApiProvider fallback={<BootScreen />}>
          <Ready>
            {/* Pita DEMO kuning ada di bawah status bar pada kedua tema, jadi ikon status bar selalu gelap. */}
            <StatusBar style="dark" />
            <View style={{ flex: 1 }}>
              <DemoStrip />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'default' }}>
                <Stack.Screen name="demo" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
              </Stack>
            </View>
          </Ready>
        </ApiProvider>
      </ToastProvider>
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
