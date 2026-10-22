import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Wordmark } from '@/components/brand/wordmark';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon, IconTile } from '@/components/ui/icon';
import { HeroBackground } from '@/components/layout/hero-background';

const FACTS = [
  { icon: 'file-document-multiple-outline', text: 'Permintaan, penawaran berversi, invoice, dan bukti bayar dalam satu nomor pekerjaan.' },
  { icon: 'map-marker-path', text: 'Tahap perjalanan dan lokasi dengan sumber serta umur data yang selalu terlihat.' },
  { icon: 'calculator-variant-outline', text: 'Kontribusi per pekerjaan; biaya yang belum lengkap tetap ditandai sementara.' },
];

export function WelcomeScreen() {
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + space.xl }]}>
      <HeroBackground id="welcome" />
      <View style={styles.top}>
        <Wordmark height={52} />
        <Txt variant="display" tone="onHero" style={{ marginTop: space.xl }}>
          Kelola usaha derek dari telepon pertama sampai pembayaran diterima.
        </Txt>
        <View style={{ gap: space.md, marginTop: space.xl }}>
          {FACTS.map((f, i) => (
            <Animated.View key={f.icon} entering={FadeInDown.delay(80 * i).duration(260)} style={styles.fact}>
              <IconTile name={f.icon} size={40} tone="onHero" wash="heroChip" />
              <Txt variant="body" tone="onHeroSecondary" style={{ flex: 1 }}>{f.text}</Txt>
            </Animated.View>
          ))}
        </View>
      </View>
      <View style={{ gap: space.md }}>
        <View style={styles.notice}>
          <Icon name="flask-outline" size={18} tone="demoInk" />
          <Txt variant="bodySm" tone="demoInk" style={{ flex: 1 }}>
            Prototype tahap frontend. Semua data sintetis; backend, pembayaran nyata, dan integrasi belum aktif.
          </Txt>
        </View>
        <Button label="Pilih akun demo" icon="account-switch-outline" size="lg" variant="secondary" onPress={() => router.push('/demo')} />
        <Txt variant="caption" tone="onHeroSecondary" align="center">
          Dikembangkan dan diterbitkan oleh Solveit Indonesia · wordmark Tovv sementara
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  root: { flex: 1, backgroundColor: color.heroFrom, paddingHorizontal: space.xl, paddingTop: space.huge, justifyContent: 'space-between' },
  top: { maxWidth: 560 },
  fact: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', backgroundColor: color.demoWash, padding: space.md, borderRadius: radius.lg },
}));
