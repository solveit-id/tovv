import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { IconTile } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { useApi } from '@/data/api/provider';
import { errorMessage } from '@/data/api/hooks';
import { t } from '@/core/i18n';
import { AuthShell } from './auth-shell';

/**
 * Lupa kata sandi (simulasi): selalu menjawab sama apa pun emailnya agar tidak membocorkan akun yang
 * terdaftar. Tidak ada email yang benar-benar dikirim pada mode demo.
 */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const api = useApi();
  const reduced = useReducedMotion();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.requestPasswordReset(email);
      setSentTo(r.maskedEmail);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Lupa kata sandi" subtitle="Tulis email akun Anda. Kami kirimkan tautan untuk membuat kata sandi baru.">
      {sentTo ? (
        <Animated.View entering={reduced ? undefined : FadeIn.duration(240)} style={{ alignItems: 'center', gap: space.md, paddingVertical: space.lg }}>
          <Animated.View entering={reduced ? undefined : ZoomIn.duration(300).easing(easeOut)}>
            <IconTile name="email-check-outline" size={72} tone="okInk" wash="okWash" shape="circle" />
          </Animated.View>
          <Txt variant="headline" align="center">Cek email Anda</Txt>
          <Txt variant="body" tone="inkSecondary" align="center">{t('Kalau {0} terdaftar, tautan untuk mengganti kata sandi sudah kami kirim.', [sentTo])}</Txt>
          <Txt variant="caption" tone="warnInk" align="center">{t('Mode demo: tidak ada email yang benar-benar dikirim. Akun demo tetap pakai kata sandi {0}.', [api.demoPassword])}</Txt>
          <View style={{ alignSelf: 'stretch', marginTop: space.md }}>
            <Button label="Kembali ke halaman masuk" size="lg" onPress={() => router.back()} />
          </View>
        </Animated.View>
      ) : (
        <>
          <Field label="Email" icon="email-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="nama@contoh.com" error={err} returnKeyType="send" onSubmitEditing={() => void submit()} />
          <Button label="Kirim tautan" size="lg" loading={busy} onPress={() => void submit()} />
          <Button label="Kembali" variant="quiet" onPress={() => router.back()} style={{ marginTop: space.sm }} />
        </>
      )}
    </AuthShell>
  );
}
