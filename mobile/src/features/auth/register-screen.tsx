import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { useToast } from '@/components/feedback/toast';
import { useApiState } from '@/data/api/provider';
import { errorMessage } from '@/data/api/hooks';
import { t } from '@/core/i18n';
import { AuthShell } from './auth-shell';

/** Daftar sebagai pelanggan. Akun hanya tersimpan di HP ini (mode demo); tidak ada email yang dikirim. */
export function RegisterScreen() {
  const s = useStyles();
  const router = useRouter();
  const toast = useToast();
  const { api, setSession } = useApiState();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async () => {
    if (mismatch) return;
    if (!agree) {
      setErr(t('Centang dulu persetujuan di bawah.'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await api.register({ name, email, phone, password });
      await setSession(res);
      toast.show(t('Akun dibuat. Selamat datang, {0}!', [name.trim().split(' ')[0]]), 'ok');
      if (router.canDismiss()) router.dismissAll();
      router.replace('/customer');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Buat akun"
      subtitle="Daftar sebagai pelanggan untuk memesan towing dan memantau kendaraan Anda."
      footer={
        <View style={s.row}>
          <Txt variant="bodySm" tone="inkSecondary">Sudah punya akun?</Txt>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="link">
            <Txt variant="bodySm" tone="accentInk" bold>Masuk</Txt>
          </Pressable>
        </View>
      }
    >
      <Field label="Nama lengkap" icon="account-outline" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
      <Field label="Nomor HP" icon="phone-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder={t('08xx xxxx xxxx')} />
      <Field label="Email" icon="email-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="nama@contoh.com" />
      <Field label="Kata sandi" icon="lock-outline" value={password} onChangeText={setPassword} secure autoCapitalize="none" helper="Minimal 8 karakter." />
      <Field label="Ulangi kata sandi" icon="lock-check-outline" value={confirm} onChangeText={setConfirm} secure autoCapitalize="none" error={mismatch ? t('Kata sandi belum sama.') : null} />
      <Pressable onPress={() => setAgree((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: agree }} style={s.agree}>
        <View style={[s.box, agree && s.boxOn]}>{agree ? <Icon name="check" size={16} tone="onAccent" /> : null}</View>
        <Txt variant="bodySm" style={{ flex: 1 }}>Saya paham ini akun demo: datanya hanya tersimpan di HP ini dan tidak dikirim ke mana pun.</Txt>
      </Pressable>
      {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
      <Button label="Daftar" size="lg" loading={busy} disabled={mismatch} onPress={() => void submit()} style={{ marginTop: space.sm }} />
    </AuthShell>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agree: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm, marginBottom: space.sm },
  box: { width: 24, height: 24, borderRadius: radius.xs, borderWidth: 2, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: c.accent, borderColor: c.accent },
}));
