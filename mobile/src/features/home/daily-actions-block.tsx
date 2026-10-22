import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { space } from '@/core/design/tokens';
import { Sheet, SectionTitle } from '@/components/ui/nota';
import { Txt } from '@/components/ui/txt';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { ActionItem } from '@/components/nota/action-item';
import { useTovvQuery } from '@/data/api/hooks';

/** Daftar tindakan harian (FIN-05) — proyeksi dari sumber; item hilang hanya saat sumbernya selesai. */
export function DailyActionsBlock({ title = 'Perlu tindakan', limit = 5 }: { title?: string; limit?: number }) {
  const q = useTovvQuery(['daily-actions'], (api) => api.getDailyActions());
  const [all, setAll] = useState(false);
  return (
    <View>
      <SectionTitle title={title} count={q.data?.length} />
      <Sheet padded={false}>
        <QueryView q={q} loadingLabel="Menghitung tindakan dari sumber…">
          {(items) =>
            items.length === 0 ? (
              <EmptyBlock icon="check-circle-outline" title="Tidak ada yang tertahan" body="Semua sumber (penawaran, penugasan, bukti, piutang) sedang tidak memerlukan tindakan Anda." />
            ) : (
              <>
                {(all ? items : items.slice(0, limit)).map((it, i, arr) => (
                  <ActionItem key={it.key} item={it} last={i === arr.length - 1 && items.length <= limit} />
                ))}
                {items.length > limit ? (
                  <Pressable onPress={() => setAll((v) => !v)} accessibilityRole="button" style={{ padding: space.lg, minHeight: 48 }}>
                    <Txt variant="bodySm" tone="carbon" style={{ fontWeight: '700' }}>
                      {all ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${items.length})`}
                    </Txt>
                  </Pressable>
                ) : null}
              </>
            )
          }
        </QueryView>
      </Sheet>
    </View>
  );
}
