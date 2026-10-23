import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { ActionItem } from '@/components/business/action-item';
import { useTovvQuery } from '@/data/api/hooks';
import { t } from '@/core/i18n';

/** Daftar tindakan harian (FIN-05) — proyeksi dari sumber; item hilang hanya saat sumbernya selesai. */
export function DailyActionsBlock({ title = 'Perlu tindakan', limit = 5, hint = 'Yang paling menghambat ada di atas.' }: { title?: string; limit?: number; hint?: string }) {
  const q = useTovvQuery(['daily-actions'], (api) => api.getDailyActions());
  const [all, setAll] = useState(false);
  return (
    <View>
      <SectionTitle title={title} count={q.data?.length} hint={q.data?.length ? hint : undefined} />
      <QueryView q={q} skeleton="action" skeletonRows={2} loadingLabel="Menghitung yang perlu ditindaklanjuti…">
        {(items) =>
          items.length === 0 ? (
            <Card>
              <EmptyBlock icon="check-circle-outline" title="Semua beres" body="Tidak ada penawaran, penugasan, bukti bayar, atau tagihan yang menunggu Anda saat ini." />
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
                  label={all ? 'Tampilkan lebih sedikit' : t('Lihat {0} lainnya', [items.length - limit])}
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
