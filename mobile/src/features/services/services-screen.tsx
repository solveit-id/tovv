import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useSession } from '@/data/api/provider';
import { t } from '@/core/i18n';
import { ServiceCard } from './service-card';

/**
 * Paket layanan towing: Car Towing, Car Carrier, Storing Motor, Self Drive. Setiap paket menjelaskan
 * kecepatan, biaya relatif, kapasitas, dan cocok untuk apa, lalu bisa langsung dipesan.
 * Harga "mulai dari" adalah contoh DEMO; harga pasti selalu datang dari penawaran operator.
 */
export function ServicesScreen() {
  const s = useStyles();
  const router = useRouter();
  const session = useSession();
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const q = useTovvQuery(['service-packages'], (api) => api.listServicePackages());

  return (
    <Screen header={<DetailHeader title="Paket layanan" subtitle="Pilih yang paling cocok untuk kendaraan Anda" />}>
      <View style={s.note}>
        <Icon name="information-outline" size={18} tone="accentInk" />
        <Txt variant="bodySm" style={{ flex: 1 }}>
          {staff ? 'Harga di sini contoh untuk demo. Harga pasti tetap Anda tentukan di penawaran.' : 'Harga di sini contoh untuk demo. Harga pasti dikirim operator sebelum Anda setuju.'}
        </Txt>
      </View>
      <QueryView q={q} skeleton="detail" loadingLabel="Memuat paket layanan…">
        {(list) =>
          list.map((p) => (
            <ServiceCard
              key={p.kind}
              p={p}
              orderLabel={staff ? t('Catat permintaan {0}', [p.name]) : t('Pesan {0}', [p.name])}
              onOrder={() => router.push({ pathname: '/request/new', params: { service: p.kind } })}
            />
          ))
        }
      </QueryView>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  note: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.lg, backgroundColor: c.accentSoft, marginBottom: space.lg },
}));
