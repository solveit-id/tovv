import React from 'react';
import { useRouter } from 'expo-router';
import { HeaderIconButton } from '@/components/layout/app-header';
import { useTovvQuery } from '@/data/api/hooks';

/** Inbox (notifikasi simulasi) dan ganti akun demo di header akar. */
export function HeaderActions() {
  const router = useRouter();
  const inbox = useTovvQuery(['inbox'], (api) => api.listInbox());
  const unread = inbox.data?.filter((i) => !i.read).length ?? 0;
  return (
    <>
      <HeaderIconButton icon="bell-outline" label="Kotak masuk" badge={unread} onPress={() => router.push('/inbox')} />
      <HeaderIconButton icon="account-switch-outline" label="Ganti akun demo" onPress={() => router.push('/demo')} />
    </>
  );
}
