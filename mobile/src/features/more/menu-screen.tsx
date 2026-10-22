import React from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTheme, type ThemePreference } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Segmented } from '@/components/ui/form';
import { ListRow } from '@/components/ui/summary';
import { Card, SectionTitle } from '@/components/ui/surface';
import { useTovvQuery } from '@/data/api/hooks';
import { useApiState } from '@/data/api/provider';
import type { ViewGroup } from '@/domain/types';

export interface MenuItem {
  icon: string;
  label: string;
  hint: string;
  href?: Href;
  onPress?: () => void;
}

function Row({ item, last }: { item: MenuItem; last: boolean }) {
  const router = useRouter();
  return <ListRow icon={item.icon} title={item.label} body={item.hint} last={last} onPress={() => (item.onPress ? item.onPress() : item.href && router.push(item.href))} />;
}

/** Pilihan tampilan: ikut sistem, terang, atau gelap. Disimpan di perangkat ini saja. */
function AppearancePicker() {
  const { preference, setPreference } = useTheme();
  return (
    <Segmented<ThemePreference>
      value={preference}
      onChange={setPreference}
      options={[
        { value: 'system', label: 'Ikut sistem' },
        { value: 'light', label: 'Terang' },
        { value: 'dark', label: 'Gelap' },
      ]}
    />
  );
}

const VIEW_LABEL: Record<ViewGroup, string> = { owner: 'Owner', admin: 'Admin', driver: 'Driver', customer: 'Pelanggan' };

/** Menu "Lainnya": fitur sekunder per peran, perpindahan konteks eksplisit, dan pengaturan demo. */
export function MenuScreen({ groups }: { groups: { title: string; items: MenuItem[] }[] }) {
  const router = useRouter();
  const { switchView } = useApiState();
  const session = useTovvQuery(['session'], (a) => a.getSession());
  const s = session.data;
  const others = s?.views.filter((v) => v !== s.view) ?? [];
  return (
    <Screen headerScrolls header={<RootHeader title="Lainnya" subtitle={s ? `${s.userName} · ${s.tenantName}` : undefined} />}>
      {others.length ? (
        <>
          <SectionTitle title="Konteks" />
          <Card style={{ paddingVertical: 0 }}>
            {others.map((v, i) => (
              <Row
                key={v}
                last={i === others.length - 1}
                item={{
                  icon: v === 'driver' ? 'steering' : 'briefcase-outline',
                  label: `Pindah ke mode ${VIEW_LABEL[v]}`,
                  hint: v === 'driver' ? 'Hanya tugas Anda; izin owner tidak ikut' : 'Mengaktifkan izin owner kembali',
                  onPress: () => void switchView(v).then(() => router.replace(`/${v}`)),
                }}
              />
            ))}
          </Card>
        </>
      ) : null}
      {groups.map((g) => (
        <View key={g.title}>
          <SectionTitle title={g.title} />
          <Card style={{ paddingVertical: 0 }}>
            {g.items.map((it, i) => <Row key={it.label} item={it} last={i === g.items.length - 1} />)}
          </Card>
        </View>
      ))}
      <SectionTitle title="Tampilan" hint="Tema gelap nyaman di malam hari; tema terang lebih jelas di bawah matahari." />
      <AppearancePicker />
      <SectionTitle title="Aplikasi" />
      <Card style={{ paddingVertical: 0 }}>
        <Row item={{ icon: 'bell-outline', label: 'Kotak masuk', hint: 'Notifikasi simulasi; push belum diaktifkan', href: '/inbox' }} last={false} />
        <Row item={{ icon: 'cloud-sync-outline', label: 'Antrean sinkronisasi', hint: 'Catatan yang tersimpan di ponsel', href: '/sync' }} last={false} />
        <Row item={{ icon: 'flask-outline', label: 'Mode demo & tentang', hint: 'Simulasi offline/gagal, reset data, Solveit Indonesia', href: '/about' }} last={false} />
        <Row item={{ icon: 'account-switch-outline', label: 'Ganti akun demo', hint: 'Bukan login produksi', href: '/demo' }} last />
      </Card>
    </Screen>
  );
}
