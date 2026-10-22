import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, touch } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { useTovvQuery } from '@/data/api/hooks';

const VIEW_LABEL = { owner: 'Owner', admin: 'Admin', driver: 'Driver', customer: 'Pelanggan' } as const;

/**
 * Pita permanen "DEMO — SIMULASI FRONTEND" (PRO-01). Menyebut peran dan usaha aktif.
 * Ketuk untuk membuka pemilih akun demo — hanya ada pada mode demo lokal, bukan autentikasi produksi.
 * Tinggi 40 + hitSlop vertikal 4 = target sentuh 48 dp; peran ditulis sebelum usaha agar tidak terpotong.
 */
export function DemoStrip() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const s = useStyles();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const faults = useTovvQuery(['faults'], (api) => api.getFaults());
  const d = session.data;
  const offline = faults.data?.offline;
  return (
    <View style={[s.strip, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.push('/demo')}
        accessibilityRole="button"
        accessibilityLabel={`Mode demo, simulasi frontend. ${d ? `${d.tenantName}, ${VIEW_LABEL[d.view]}, ${d.userName}` : ''}. Ketuk untuk ganti akun demo.`}
        style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Icon name="flask-outline" size={15} tone="demoInk" />
        <Txt variant="caption" tone="demoInk" style={s.bold} maxFontSizeMultiplier={1.4} numberOfLines={1} ellipsizeMode="clip">
          DEMO — SIMULASI FRONTEND
        </Txt>
        {d ? (
          <>
            <Txt variant="caption" tone="demoInk" maxFontSizeMultiplier={1.4} numberOfLines={1} style={s.role}>
              {`· ${VIEW_LABEL[d.view]}`}
            </Txt>
            <Txt variant="caption" tone="demoInk" maxFontSizeMultiplier={1.4} numberOfLines={1} style={s.ctx}>
              {`· ${d.tenantName.replace('Operator ', '')}`}
            </Txt>
          </>
        ) : null}
        {offline ? (
          <View style={s.offline} accessibilityLabel="Simulasi offline aktif">
            <Icon name="wifi-off" size={13} tone="onInverse" />
            <Txt variant="caption" tone="onInverse" maxFontSizeMultiplier={1.3} bold>Offline</Txt>
          </View>
        ) : null}
        <View style={s.swap}>
          <Icon name="swap-horizontal" size={14} tone="demoInk" />
          <Txt variant="caption" tone="demoInk" bold maxFontSizeMultiplier={1.3}>Ganti</Txt>
        </View>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  strip: { backgroundColor: c.demoWash },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.lg, minHeight: touch.min - 8, paddingVertical: 4 },
  bold: { fontWeight: '800', letterSpacing: 0.3, flexShrink: 0 },
  role: { flexShrink: 0, fontWeight: '600' },
  ctx: { flex: 1, minWidth: 0 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.inverse, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: 'rgba(58,44,0,0.1)' },
}));
