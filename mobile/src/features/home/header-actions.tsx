import React from 'react';
import { useRouter } from 'expo-router';
import { HeaderIconButton } from '@/components/layout/app-header';
import { useTovvQuery } from '@/data/api/hooks';

/** Kotak masuk (notifikasi simulasi) di header akar. Ganti akun demo ada di pita DEMO. */
export function HeaderActions({ extra }: { extra?: React.ReactNode }) {
  const router = useRouter();
  const inbox = useTovvQuery(['inbox'], (api) => api.listInbox());
  const unread = inbox.data?.filter((i) => !i.read).length ?? 0;
  return (
    <>
      {extra}
      <HeaderIconButton icon="bell-outline" label="Kotak masuk" badge={unread} onPress={() => router.push('/inbox')} />
    </>
  );
}
