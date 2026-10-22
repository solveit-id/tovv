import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from '@/data/api/provider';
import { ToastProvider } from '@/components/feedback/toast';
import { DemoStrip } from '@/components/layout/demo-strip';
import { BootScreen } from '@/features/identity/boot-screen';
import { color } from '@/core/design/tokens';

void SplashScreen.preventAutoHideAsync();

function Ready({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.ground }}>
      <SafeAreaProvider>
        <ToastProvider>
          <ApiProvider fallback={<BootScreen />}>
            <Ready>
              <StatusBar style="dark" />
              <View style={{ flex: 1 }}>
                <DemoStrip />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.ground }, animation: 'default' }}>
                  <Stack.Screen name="demo" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
                </Stack>
              </View>
            </Ready>
          </ApiProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
