import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { color, space } from '@/core/design/tokens';
import { Wordmark } from '@/components/brand/wordmark';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

const FACTS = [
  { icon: 'file-document-multiple-outline', text: 'Permintaan, penawaran berversi, invoice, dan bukti bayar dalam satu nomor pekerjaan.' },
  { icon: 'map-marker-path', text: 'Tahap perjalanan dan lokasi dengan sumber serta umur data yang selalu terlihat.' },
  { icon: 'calculator-variant-outline', text: 'Kontribusi per pekerjaan; biaya yang belum lengkap tetap ditandai provisional.' },
];

export function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.top}>
        <Wordmark height={52} />
        <Txt variant="headline" tone="onNavy" style={{ marginTop: space.xl }}>
          Operasi towing dari telepon pertama sampai penerimaan tercatat.
        </Txt>
        <View style={{ gap: space.md, marginTop: space.xl }}>
          {FACTS.map((f, i) => (
            <Animated.View key={f.icon} entering={FadeInDown.delay(80 * i).duration(260)} style={styles.fact}>
              <Icon name={f.icon} size={22} tone="sky" />
              <Txt variant="body" tone="onNavySecondary" style={{ flex: 1 }}>{f.text}</Txt>
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
        <Button label="Pilih akun demo" icon="account-switch-outline" size="lg" onPress={() => router.push('/demo')} />
        <Txt variant="caption" tone="onNavySecondary" align="center">
          Dikembangkan dan diterbitkan oleh Solveit Indonesia · wordmark Tovv sementara
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.navy, paddingHorizontal: space.xl, paddingTop: space.huge, justifyContent: 'space-between' },
  top: { maxWidth: 560 },
  fact: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', backgroundColor: color.demoWash, padding: space.md, borderRadius: 6 },
});
