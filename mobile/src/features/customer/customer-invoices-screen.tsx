import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Money, Serial, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { collectionStatus } from '@/core/i18n/status';
import { formatLocalDate } from '@/core/format/time';

/** Tagihan pelanggan: invoice milik sendiri atau organisasi (finance/approver B2B). Pemesan B2B tidak melihat tagihan. */
export function CustomerInvoicesScreen() {
  const color = useColors();
  const styles = useStyles();
  const router = useRouter();
  const qc = useQueryClient();
  const s = useTovvQuery(['session'], (a) => a.getSession());
  const q = useTovvQuery(['invoices', 'all'], (a) => a.listInvoices('all'));
  const b2bNoFinance = !!s.data?.businessAccountName && !s.data.b2bRoles.includes('finance');
  return (
    <Screen headerScrolls onRefresh={() => qc.invalidateQueries()} header={<RootHeader title="Tagihan" subtitle="Dokumen DEMO · tidak dapat dibayar sungguhan" />}>
      {b2bNoFinance ? (
        <Card><EmptyBlock icon="account-lock-outline" title="Tagihan organisasi tidak tampil untuk pemesan" body="Finance/approver organisasi Anda yang melihat dan menindaklanjuti tagihan." /></Card>
      ) : (
        <Card padded={false}>
          <QueryView q={q}>
            {(list) =>
              list.length ? list.map((inv, i) => (
                <Pressable key={inv.id} onPress={() => router.push(`/invoice/${inv.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.row, i < list.length - 1 && styles.divider, pressed && { backgroundColor: color.accentSoft }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Serial>{inv.number}</Serial>
                    <StatusTag look={collectionStatus[inv.collection]} size="sm" />
                    <Txt variant="caption" tone={inv.overdueDays ? 'dangerInk' : 'inkSecondary'}>{`${inv.alias} · jatuh tempo ${formatLocalDate(inv.dueDate)}${inv.overdueDays ? ` · lewat ${inv.overdueDays} hari` : ''}`}</Txt>
                    {inv.proofs.some((p) => p.status === 'pending_review' || p.status === 'flagged_review') ? <Txt variant="caption" tone="warnInk">Bukti Anda sedang diperiksa</Txt> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="caption" tone="inkSecondary">Sisa</Txt>
                    <Money value={inv.outstanding} size="sm" />
                  </View>
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <EmptyBlock icon="file-document-outline" title="Belum ada tagihan" body="Tagihan terbit setelah serah-terima." />
            }
          </QueryView>
        </Card>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
}));
