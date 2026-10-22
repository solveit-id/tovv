import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space, touch } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { useTovvQuery } from '@/data/api/hooks';

const VIEW_LABEL = { owner: 'Owner', admin: 'Admin', driver: 'Driver', customer: 'Pelanggan' } as const;

/**
 * Pita permanen "DEMO — SIMULASI FRONTEND" (PRO-01). Menyebut tenant dan konteks tampilan aktif.
 * Ketuk untuk membuka pemilih akun demo — hanya ada pada mode demo lokal, bukan autentikasi produksi.
 * Tinggi 40 + hitSlop vertikal 4 = target sentuh 48 dp; peran ditulis sebelum tenant agar tidak terpotong.
 */
export function DemoStrip() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const faults = useTovvQuery(['faults'], (api) => api.getFaults());
  const s = session.data;
  const offline = faults.data?.offline;
  return (
    <View style={[styles.strip, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.push('/demo')}
        accessibilityRole="button"
        accessibilityLabel={`Mode demo, simulasi frontend. ${s ? `${s.tenantName}, ${VIEW_LABEL[s.view]}, ${s.userName}` : ''}. Ketuk untuk ganti akun demo.`}
        style={styles.row}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Icon name="flask-outline" size={14} tone="demoInk" />
        <Txt variant="caption" tone="demoInk" style={styles.bold} maxFontSizeMultiplier={1.4} numberOfLines={1} ellipsizeMode="clip">
          DEMO — SIMULASI FRONTEND
        </Txt>
        {s ? (
          <>
            <Txt variant="caption" tone="demoInk" maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.role}>
              {`· ${VIEW_LABEL[s.view]}`}
            </Txt>
            <Txt variant="caption" tone="demoInk" maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.ctx}>
              {`· ${s.tenantName.replace('Operator ', '')}`}
            </Txt>
          </>
        ) : null}
        {offline ? (
          <View style={styles.offline} accessibilityLabel="Simulasi offline aktif">
            <Icon name="wifi-off" size={13} tone="onNavy" />
            <Txt variant="caption" tone="onNavy" maxFontSizeMultiplier={1.3}>Offline</Txt>
          </View>
        ) : null}
        <Icon name="swap-horizontal" size={14} tone="demoInk" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { backgroundColor: color.demoWash, borderBottomWidth: 1, borderBottomColor: color.demoRule },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.lg, minHeight: touch.min - 8, paddingVertical: 4 },
  bold: { fontWeight: '700', letterSpacing: 0.3, flexShrink: 0 },
  role: { flexShrink: 0 },
  ctx: { flex: 1, minWidth: 0 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: color.dangerInk, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
});
