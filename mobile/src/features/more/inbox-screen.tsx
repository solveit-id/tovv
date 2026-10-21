import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/nota';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useApi } from '@/data/api/provider';
import { useTovvQuery } from '@/data/api/hooks';
import { formatAge } from '@/core/format/time';

/** Kotak masuk (MOB-05) — notifikasi simulasi dari event bisnis; tautan tetap diperiksa izinnya saat dibuka. */
export function InboxScreen() {
  const router = useRouter();
  const api = useApi();
  const q = useTovvQuery(['inbox'], (a) => a.listInbox());
  return (
    <Screen header={<DetailHeader title="Kotak masuk" subtitle="Simulasi · push perangkat belum diaktifkan" />}>
      <Sheet padded={false}>
        <QueryView q={q}>
          {(list) =>
            list.length ? list.map((n, i) => (
              <Pressable
                key={n.id}
                onPress={() => {
                  void api.markInboxRead(n.id);
                  if (n.link) router.push(n.link as Href);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${n.read ? '' : 'Belum dibaca. '}${n.title}. ${n.body}`}
                style={({ pressed }) => [styles.row, i < list.length - 1 && styles.divider, pressed && { backgroundColor: color.carbonTint }]}
              >
                <View style={[styles.dot, n.read && { backgroundColor: 'transparent' }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant={n.read ? 'body' : 'bodyStrong'}>{n.title}</Txt>
                  <Txt variant="bodySm" tone="inkSecondary">{n.body}</Txt>
                  <Txt variant="caption" tone="inkSecondary">{formatAge(n.createdAt, api.now())}</Txt>
                </View>
                {n.link ? <Icon name="chevron-right" tone="inkSecondary" /> : null}
              </Pressable>
            )) : <EmptyBlock icon="bell-outline" title="Belum ada notifikasi" />
          }
        </QueryView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, alignItems: 'flex-start' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.carbon, marginTop: 6 },
});
