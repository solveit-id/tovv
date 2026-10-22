import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { color, space } from '@/core/design/tokens';
import { Wordmark } from '@/components/brand/wordmark';
import { Txt } from '@/components/ui/txt';

/** Ditampilkan selama store demo lokal dibuka. */
export function BootScreen() {
  return (
    <View style={styles.root} accessibilityLabel="Tovv sedang dimuat">
      <Wordmark height={44} />
      <ActivityIndicator color={color.sky} />
      <Txt variant="caption" tone="onNavySecondary">Membuka data demo lokal…</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.navy, alignItems: 'center', justifyContent: 'center', gap: space.lg },
});
