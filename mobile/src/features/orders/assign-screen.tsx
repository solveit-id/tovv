import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '@/core/hooks/use-safe-back';
import { space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { SectionTitle, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import { assignmentStatus } from '@/core/i18n/status';
import { formatShortDateTime, formatTime } from '@/core/format/time';

/** Tawarkan/alihkan tugas (FLT-05). Tawaran belum diterima tidak dianggap dispatch pasti; akses lama dicabut. */
export function AssignScreen() {
  const color = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = useSafeBack(`/order/${id}`);
  const order = useTovvQuery(['order', id], (a) => a.getOrder(id));
  const fleet = useTovvQuery(['fleet'], (a) => a.getFleet());
  const [pick, setPick] = useState<string | null>(null);
  const offer = useTovvMutation((a, driverId: string) => a.offerAssignment(id, driverId), {
    success: 'Tawaran terkirim. Order tetap terkonfirmasi sampai petugas menerima.',
    onSuccess: () => goBack(),
  });
  const current = order.data?.assignments.find((a) => a.status === 'offered' || a.status === 'accepted');
  return (
    <Screen
      header={<DetailHeader serial={order.data ? `O-${order.data.summary.alias}` : undefined} title="Penugasan" subtitle={order.data ? `${formatShortDateTime(order.data.summary.scheduleStart)}–${formatTime(order.data.summary.scheduleEnd)} · unit ${order.data.summary.unitCode}` : undefined} />}
      footer={<Button label={current ? 'Alihkan ke petugas terpilih' : 'Tawarkan tugas'} icon="send-outline" size="lg" disabled={!pick} loading={offer.isPending} onPress={() => pick && offer.mutate(pick)} />}
    >
      {current ? (
        <Card>
          <Txt variant="label" tone="inkSecondary">Saat ini</Txt>
          <Txt variant="bodyStrong">{current.driverName}</Txt>
          <StatusTag look={assignmentStatus[current.status]} size="sm" />
          <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.sm }}>Mengalihkan mencabut akses tugas petugas lama dan menyimpan histori.</Txt>
        </Card>
      ) : null}
      <SectionTitle title="Pilih petugas" />
      <QueryView q={fleet}>
        {(f) => (
          <Card padded={false}>
            {f.drivers.map((dr, i) => {
              const on = pick === dr.id;
              const isCurrent = current?.driverId === dr.id;
              return (
                <Pressable
                  key={dr.id}
                  disabled={isCurrent}
                  onPress={() => setPick(dr.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: isCurrent }}
                  style={({ pressed }) => [styles.row, i < f.drivers.length - 1 && styles.divider, on && { backgroundColor: color.accentSoft }, pressed && { opacity: 0.85 }]}
                >
                  <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} tone={isCurrent ? 'inkMuted' : on ? 'accentInk' : 'inkSecondary'} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" tone={isCurrent ? 'inkSecondary' : 'ink'}>{dr.name}{isCurrent ? ' · saat ini' : ''}</Txt>
                    <Txt variant="caption" tone="inkSecondary">{dr.roles.includes('owner') ? 'Owner merangkap driver' : dr.roles.includes('partner') ? 'Mitra kelolaan' : 'Driver'}{dr.activeAssignment ? ` · ${dr.activeAssignment}` : ' · tidak ada tugas aktif'}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}
      </QueryView>
      <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.md }}>Bentrok jadwal petugas diperiksa saat mengirim tawaran; konflik ditolak, bukan ditimpa.</Txt>
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 64 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
}));
