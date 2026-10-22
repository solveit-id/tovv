import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { ActionItem } from '@/components/business/action-item';
import { useTovvQuery } from '@/data/api/hooks';

/** Daftar tindakan harian (FIN-05) — proyeksi dari sumber; item hilang hanya saat sumbernya selesai. */
export function DailyActionsBlock({ title = 'Perlu tindakan', limit = 5, hint = 'Diurutkan dari yang menghambat pekerjaan.' }: { title?: string; limit?: number; hint?: string }) {
  const q = useTovvQuery(['daily-actions'], (api) => api.getDailyActions());
  const [all, setAll] = useState(false);
  return (
    <View>
      <SectionTitle title={title} count={q.data?.length} hint={q.data?.length ? hint : undefined} />
      <QueryView q={q} loadingLabel="Menghitung tindakan dari sumber…">
        {(items) =>
          items.length === 0 ? (
            <Card>
              <EmptyBlock icon="check-circle-outline" title="Tidak ada yang tertahan" body="Penawaran, penugasan, bukti bayar dan piutang sedang tidak memerlukan tindakan Anda." />
            </Card>
          ) : (
            <>
              {(all ? items : items.slice(0, limit)).map((it, i) => (
                <ActionItem key={it.key} item={it} index={i} />
              ))}
              {items.length > limit ? (
                <Button
                  variant="secondary"
                  icon={all ? 'chevron-up' : 'chevron-down'}
                  label={all ? 'Tampilkan lebih sedikit' : `Lihat ${items.length - limit} lainnya`}
                  onPress={() => setAll((v) => !v)}
                />
              ) : null}
            </>
          )
        }
      </QueryView>
    </View>
  );
}
