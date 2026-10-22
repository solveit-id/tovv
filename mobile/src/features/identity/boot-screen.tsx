import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Wordmark } from '@/components/brand/wordmark';
import { Txt } from '@/components/ui/txt';
import { HeroBackground } from '@/components/layout/hero-background';

/** Ditampilkan selama store demo lokal dibuka. */
export function BootScreen() {
  const color = useColors();
  const styles = useStyles();
  return (
    <View style={styles.root} accessibilityLabel="Tovv sedang dimuat">
      <HeroBackground id="boot" />
      <Wordmark height={44} />
      <ActivityIndicator color={color.onHero} />
      <Txt variant="caption" tone="onHeroSecondary">Membuka data demo lokal…</Txt>
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  root: { flex: 1, backgroundColor: color.heroFrom, alignItems: 'center', justifyContent: 'center', gap: space.lg },
}));
