import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader, RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import { outboxStatus } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';

/**
 * Antrean sinkronisasi (OPS-03, MOB-03). Item tersimpan di ponsel (SQLite lokal) dan bertahan setelah aplikasi
 * ditutup. "Diterima" di sini = diterima adapter demo, bukan bukti upload ke server nyata.
 */
export function SyncScreen({ asTab = false }: { asTab?: boolean }) {
  const q = useTovvQuery(['outbox'], (a) => a.listOutbox());
  const faults = useTovvQuery(['faults'], (a) => a.getFaults());
  const sync = useTovvMutation((a) => a.syncOutbox(), { success: (r) => `Antrean diproses: ${r.filter((x) => x.status === 'synced').length} diterima, ${r.filter((x) => x.status === 'needs_review').length} perlu ditinjau.` });
  const pending = q.data?.filter((x) => x.status === 'pending').length ?? 0;
  return (
    <Screen headerScrolls={asTab}
      header={asTab ? <RootHeader title="Sinkronisasi" subtitle="Catatan yang tersimpan di ponsel" /> : <DetailHeader title="Antrean sinkronisasi" />}
      footer={<Button label={faults.data?.offline ? 'Masih offline — coba kirim' : pending ? `Kirim ${pending} item tertunda` : 'Tidak ada item tertunda'} icon="cloud-upload-outline" size="lg" disabled={!pending} loading={sync.isPending} onPress={() => sync.mutate(undefined)} />}
    >
      {faults.data?.offline ? (
        <View style={styles.offline}>
          <Txt variant="bodySm" tone="dangerInk" style={{ fontWeight: '600' }}>Simulasi offline aktif. Item tetap aman di ponsel; matikan di Mode demo untuk mengirim.</Txt>
        </View>
      ) : null}
      <Sheet padded={false}>
        <QueryView q={q}>
          {(list) =>
            list.length ? list.map((x, i) => (
              <View key={x.localId} style={[styles.row, i < list.length - 1 && styles.divider]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="bodyStrong">{x.label}</Txt>
                  <StatusTag look={outboxStatus[x.status]} size="sm" />
                  <Txt variant="caption" tone="inkSecondary">{`Kejadian ${formatShortDateTime(x.eventAt)} · percobaan ${x.attempts} · ${x.localId}`}</Txt>
                  {x.lastError ? <Txt variant="caption" tone="dangerInk">{x.lastError}</Txt> : null}
                </View>
              </View>
            )) : <EmptyBlock icon="cloud-check-outline" title="Tidak ada antrean" body="Status, foto, dan biaya yang dicatat saat offline akan muncul di sini." />
          }
        </QueryView>
      </Sheet>
      <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.md }}>
        Pengiriman ulang memakai ID unik yang sama sehingga tidak menggandakan status, foto, atau biaya. Persetujuan harga, reservasi, dan verifikasi pembayaran tidak pernah final saat offline.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: space.lg, gap: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  offline: { backgroundColor: color.dangerWash, padding: space.md, borderRadius: 6, marginBottom: space.md },
});
