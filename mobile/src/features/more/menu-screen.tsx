import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Sheet, SectionTitle } from '@/components/ui/nota';
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
  return (
    <Pressable
      onPress={() => (item.onPress ? item.onPress() : item.href && router.push(item.href))}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${item.hint}`}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { backgroundColor: color.carbonTint }]}
    >
      <Icon name={item.icon} size={22} tone="carbon" />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{item.label}</Txt>
        <Txt variant="caption" tone="inkSecondary">{item.hint}</Txt>
      </View>
      <Icon name="chevron-right" tone="inkSecondary" />
    </Pressable>
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
    <Screen header={<RootHeader title="Lainnya" subtitle={s ? `${s.userName} · ${s.tenantName}` : undefined} />}>
      {others.length ? (
        <>
          <SectionTitle title="Konteks" />
          <Sheet padded={false}>
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
          </Sheet>
        </>
      ) : null}
      {groups.map((g) => (
        <View key={g.title}>
          <SectionTitle title={g.title} />
          <Sheet padded={false}>
            {g.items.map((it, i) => <Row key={it.label} item={it} last={i === g.items.length - 1} />)}
          </Sheet>
        </View>
      ))}
      <SectionTitle title="Aplikasi" />
      <Sheet padded={false}>
        <Row item={{ icon: 'bell-outline', label: 'Kotak masuk', hint: 'Notifikasi simulasi; push belum diaktifkan', href: '/inbox' }} last={false} />
        <Row item={{ icon: 'cloud-sync-outline', label: 'Antrean sinkronisasi', hint: 'Catatan yang tersimpan di ponsel', href: '/sync' }} last={false} />
        <Row item={{ icon: 'flask-outline', label: 'Mode demo & tentang', hint: 'Simulasi offline/gagal, reset data, Solveit Indonesia', href: '/about' }} last={false} />
        <Row item={{ icon: 'account-switch-outline', label: 'Ganti akun demo', hint: 'Bukan login produksi', href: '/demo' }} last />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 60 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
});
