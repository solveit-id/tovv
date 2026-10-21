import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { color, radius, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Sheet, SectionTitle } from '@/components/ui/nota';
import { QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useApiState } from '@/data/api/provider';
import type { DemoAccount } from '@/data/api/contract';
import type { ViewGroup } from '@/domain/types';

const VIEW = {
  owner: { label: 'Owner', icon: 'briefcase-outline', hint: 'Harga, delegasi, laporan, paket SaaS' },
  admin: { label: 'Admin', icon: 'clipboard-text-outline', hint: 'Permintaan, jadwal, penugasan, invoice' },
  driver: { label: 'Driver', icon: 'steering', hint: 'Hanya tugas sendiri; tanpa margin' },
  customer: { label: 'Pelanggan', icon: 'account-outline', hint: 'Permintaan, penawaran, tagihan sendiri' },
} as const;

/**
 * Pemilih akun DEMO lokal. Bukan autentikasi produksi: produksi memakai sesi perangkat dari server (TEN-04).
 * Mengganti akun/konteks menghapus cache data akun sebelumnya.
 */
export function DemoAccountScreen() {
  const { api, setSession, session } = useApiState();
  const router = useRouter();
  const q = useQuery({ queryKey: ['demo-accounts'], queryFn: () => api.listDemoAccounts() });
  const [pick, setPick] = useState<DemoAccount | null>(null);

  const enter = async (acc: DemoAccount, view: ViewGroup) => {
    setPick(null);
    await setSession({ userId: acc.userId, view });
    if (router.canDismiss()) router.dismissAll();
    router.replace(`/${view}`);
  };

  return (
    <Screen header={<DetailHeader title="Pilih akun demo" subtitle="Hanya mode demo lokal · bukan login produksi" />}>
      <Sheet style={{ backgroundColor: color.demoWash, borderColor: color.demoRule }}>
        <Txt variant="bodySm" tone="demoInk">
          Akun di bawah adalah fixture sintetis F-05. Tidak ada kata sandi karena ini simulasi; aplikasi nyata memakai sesi
          perangkat dari server, dan peran tidak bisa diubah dari ponsel.
        </Txt>
      </Sheet>
      <QueryView q={q} loadingLabel="Memuat akun demo…">
        {(accounts) =>
          (['tenant-a', 'tenant-b'] as const).map((t) => {
            const list = accounts.filter((a) => a.tenantId === t);
            return (
              <View key={t}>
                <SectionTitle title={list[0]?.tenantName ?? t} count={list.length} />
                <Sheet padded={false}>
                  {list.map((a, i) => {
                    const active = session?.userId === a.userId;
                    return (
                      <Pressable
                        key={a.userId}
                        onPress={() => (a.views.length > 1 ? setPick(a) : void enter(a, a.views[0]!))}
                        accessibilityRole="button"
                        accessibilityLabel={`${a.name}, ${a.roleLabel}. ${a.note}${active ? '. Sedang aktif' : ''}`}
                        style={({ pressed }) => [styles.row, i < list.length - 1 && styles.divider, pressed && { backgroundColor: color.carbonTint }]}
                      >
                        <View style={styles.avatar}>
                          <Txt variant="bodyStrong" tone="onNavy">{a.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</Txt>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Txt variant="bodyStrong">{a.name}{active ? '  · aktif' : ''}</Txt>
                          <Txt variant="bodySm" tone="carbon">{a.roleLabel}</Txt>
                          {a.note ? <Txt variant="caption" tone="inkSecondary">{a.note}</Txt> : null}
                        </View>
                        <Icon name="chevron-right" tone="inkSecondary" />
                      </Pressable>
                    );
                  })}
                </Sheet>
              </View>
            );
          })
        }
      </QueryView>
      <BottomSheet visible={!!pick} title={pick ? `Masuk sebagai ${pick.name}` : ''} onClose={() => setPick(null)}>
        <Txt variant="bodySm" tone="inkSecondary" style={{ marginBottom: space.md }}>
          Akun ini memiliki lebih dari satu kemampuan. Pilih konteks secara eksplisit; mode driver tidak membawa izin owner.
        </Txt>
        <View style={{ gap: space.sm }}>
          {pick?.views.map((v) => (
            <Button key={v} label={`${VIEW[v].label} — ${VIEW[v].hint}`} icon={VIEW[v].icon} variant="secondary" onPress={() => void enter(pick, v)} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 64 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  avatar: { width: 40, height: 40, borderRadius: radius.control, backgroundColor: color.navy, alignItems: 'center', justifyContent: 'center' },
});
