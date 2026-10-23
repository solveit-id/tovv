import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useApiState } from '@/data/api/provider';
import { errorMessage } from '@/data/api/hooks';
import { t } from '@/core/i18n';
import { AuthShell } from './auth-shell';

/** Akun cepat untuk mencoba tiap peran; semua akun demo memakai kata sandi yang sama. */
const QUICK = [
  { userId: 'owner-a', role: 'Owner', icon: 'briefcase-outline' },
  { userId: 'driver-a1', role: 'Driver', icon: 'steering' },
  { userId: 'customer-a1', role: 'Pelanggan', icon: 'account-outline' },
] as const;

/**
 * Masuk dengan email dan kata sandi akun demo. Ini login lokal untuk demonstrasi, bukan autentikasi
 * produksi: tidak ada server atau token; kata sandi demo ditampilkan di layar.
 */
export function LoginScreen() {
  const s = useStyles();
  const router = useRouter();
  const { api, setSession } = useApiState();
  const accounts = useQuery({ queryKey: ['demo-accounts'], queryFn: () => api.listDemoAccounts() });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const passRef = useRef<TextInput>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setErr(t('Isi email dan kata sandi dulu, ya.'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await api.login(email, password);
      await setSession(res);
      router.replace(`/${res.view}`);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (userId: string) => {
    const acc = accounts.data?.find((a) => a.userId === userId);
    if (!acc) return;
    setEmail(acc.email);
    setPassword(api.demoPassword);
    setErr(null);
  };

  return (
    <AuthShell
      title="Selamat datang"
      subtitle="Masuk untuk mengatur derek, memantau perjalanan, dan mengecek tagihan."
      footer={
        <View style={s.row}>
          <Txt variant="bodySm" tone="inkSecondary">Belum punya akun?</Txt>
          <Pressable onPress={() => router.push('/auth/register')} hitSlop={10} accessibilityRole="link">
            <Txt variant="bodySm" tone="accentInk" bold>Daftar</Txt>
          </Pressable>
        </View>
      }
    >
      <Field label="Email" icon="email-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="nama@contoh.com" returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} />
      <Field label="Kata sandi" icon="lock-outline" value={password} onChangeText={setPassword} secure autoCapitalize="none" autoComplete="password" inputRef={passRef} returnKeyType="go" onSubmitEditing={() => void submit()} error={err} />
      <Pressable onPress={() => router.push('/auth/forgot-password')} hitSlop={10} accessibilityRole="link" style={s.forgot}>
        <Txt variant="bodySm" tone="accentInk" bold>Lupa kata sandi?</Txt>
      </Pressable>
      <Button label="Masuk" size="lg" loading={busy} onPress={() => void submit()} />

      <View style={s.divider}>
        <View style={s.line} />
        <Txt variant="caption" tone="inkSecondary">atau coba akun demo</Txt>
        <View style={s.line} />
      </View>
      <View style={s.quick}>
        {QUICK.map((q) => {
          const acc = accounts.data?.find((a) => a.userId === q.userId);
          return (
            <PressableScale key={q.userId} depth="subtle" onPress={() => fillDemo(q.userId)} accessibilityRole="button" accessibilityLabel={t('Isi akun demo {0}', [t(q.role)])} style={s.quickItem}>
              <Icon name={q.icon} size={22} tone="accentInk" />
              <Txt variant="bodySm" bold>{q.role}</Txt>
              <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>{acc?.name.split(' ')[0] ?? ' '}</Txt>
            </PressableScale>
          );
        })}
      </View>
      <View style={s.note}>
        <Icon name="flask-outline" size={16} tone="demoInk" />
        <Txt variant="caption" tone="demoInk" style={{ flex: 1 }}>{t('Mode demo: ketuk salah satu akun di atas, lalu tekan Masuk. Kata sandi semua akun demo: {0}. Tidak ada data yang dikirim ke server.', [api.demoPassword])}</Txt>
      </View>
      <Button label="Lihat semua akun demo" variant="quiet" compact onPress={() => router.push('/demo')} />
    </AuthShell>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  forgot: { alignSelf: 'flex-end', marginTop: -space.sm, marginBottom: space.lg, minHeight: 32, justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xl, marginBottom: space.md },
  line: { flex: 1, height: 1, backgroundColor: c.line },
  quick: { flexDirection: 'row', gap: space.sm },
  quickItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.md, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  note: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', backgroundColor: c.demoWash, borderRadius: radius.md, padding: space.md, marginTop: space.md },
}));
