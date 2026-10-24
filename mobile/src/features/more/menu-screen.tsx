import React from 'react';
import { space } from '@/core/design/tokens';
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
import { APP_VIEWS, type ViewGroup } from '@/domain/types';
import { setLocale, t, useLocale, type Locale } from '@/core/i18n';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/feedback/dialog';
import { useToast } from '@/components/feedback/toast';
import { useModeSwitch } from '@/features/home/use-mode-switch';

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
  const toast = useToast();
  const NAME: Record<ThemePreference, string> = { system: 'ikut sistem', light: 'terang', dark: 'gelap' };
  return (
    <Segmented<ThemePreference>
      value={preference}
      onChange={(p) => {
        setPreference(p);
        toast.show(t('Tampilan diganti: {0}.', [t(NAME[p])]), 'ok');
      }}
      options={[
        { value: 'system', label: 'Ikut sistem' },
        { value: 'light', label: 'Terang' },
        { value: 'dark', label: 'Gelap' },
      ]}
    />
  );
}

/** Bahasa aplikasi. Teks layar langsung berganti; data dimuat ulang dalam bahasa baru. */
function LanguagePicker() {
  const locale = useLocale();
  const toast = useToast();
  return (
    <Segmented<Locale>
      value={locale}
      onChange={(l) => {
        setLocale(l);
        toast.show(l === 'en' ? 'Language changed to English.' : 'Bahasa diganti ke Bahasa Indonesia.', 'ok');
      }}
      options={[
        { value: 'id', label: 'Bahasa Indonesia' },
        { value: 'en', label: 'English' },
      ]}
    />
  );
}

const VIEW_LABEL: Record<ViewGroup, string> = { owner: 'Owner', admin: 'Admin', driver: 'Driver', customer: 'Pelanggan' };

/** Menu "Lainnya": fitur sekunder per peran, perpindahan konteks eksplisit, dan pengaturan demo. */
export function MenuScreen({ groups }: { groups: { title: string; items: MenuItem[] }[] }) {
  const router = useRouter();
  const { setSession } = useApiState();
  const switchMode = useModeSwitch();
  const dialog = useDialog();
  const session = useTovvQuery(['session'], (a) => a.getSession());
  const s = session.data;
  const others = s?.views.filter((v) => v !== s.view && APP_VIEWS.includes(v)) ?? [];
  const logout = async () => {
    const ok = await dialog.confirm({
      title: 'Keluar dari Tovv?',
      message: 'Data demo di HP ini tetap tersimpan. Anda bisa masuk lagi kapan saja.',
      icon: 'logout',
      tone: 'danger',
      confirmLabel: 'Keluar',
      cancelLabel: 'Batal',
    });
    if (!ok) return;
    await setSession(null);
    if (router.canDismiss()) router.dismissAll();
    router.replace('/auth/login');
  };
  return (
    <Screen headerScrolls header={<RootHeader title="Lainnya" subtitle={s ? `${s.userName} · ${s.tenantName}` : undefined} />}>
      {others.length ? (
        <>
          <SectionTitle title="Peran" />
          <Card style={{ paddingVertical: 0 }}>
            {others.map((v, i) => (
              <Row
                key={v}
                last={i === others.length - 1}
                item={{
                  icon: v === 'driver' ? 'steering' : 'briefcase-outline',
                  label: t('Pindah ke mode {0}', [t(VIEW_LABEL[v])]),
                  hint: v === 'driver' ? 'Hanya tugas Anda yang tampil; akses owner tidak ikut.' : 'Kembali ke semua menu owner.',
                  onPress: () => void (v === 'owner' || v === 'driver' ? switchMode(v) : undefined),
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
      <SectionTitle title="Bahasa" />
      <LanguagePicker />
      <SectionTitle title="Tampilan" hint="Tema gelap nyaman di malam hari; tema terang lebih jelas di bawah matahari." />
      <AppearancePicker />
      <SectionTitle title="Aplikasi" />
      <Card style={{ paddingVertical: 0 }}>
        <Row item={{ icon: 'bell-outline', label: 'Kotak masuk', hint: 'Pemberitahuan di dalam aplikasi. Notifikasi ke HP belum aktif.', href: '/inbox' }} last={false} />
        <Row item={{ icon: 'cloud-sync-outline', label: 'Antrean kirim ulang', hint: 'Catatan yang belum terkirim karena sinyal putus.', href: '/sync' }} last={false} />
        <Row item={{ icon: 'flask-outline', label: 'Mode demo & tentang', hint: 'Coba kondisi offline, kembalikan data awal, info Solveit.', href: '/about' }} last={false} />
        <Row item={{ icon: 'account-switch-outline', label: 'Ganti akun demo', hint: 'Pindah ke akun contoh lain tanpa keluar.', href: '/demo' }} last />
      </Card>
      <Button label="Keluar" icon="logout" variant="danger" onPress={() => void logout()} style={{ marginTop: space.xl }} />
    </Screen>
  );
}
