import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader, RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { LineItem, Money, SectionTitle, Card } from '@/components/ui/surface';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { formatNumber } from '@/core/format/money';
import { formatShortDateTime, formatTime } from '@/core/format/time';

/** Armada & jadwal (FLT-01/FLT-04): spesifikasi, status, posisi terakhir dengan umur, dan reservasi terkonfirmasi. */
export function FleetScreen({ asTab = false }: { asTab?: boolean }) {
  const styles = useStyles();
  const q = useTovvQuery(['fleet'], (a) => a.getFleet());
  return (
    <Screen headerScrolls={asTab} header={asTab ? <RootHeader title="Jadwal & armada" subtitle="Reservasi hanya dibuat saat penawaran disetujui" /> : <DetailHeader title="Armada" subtitle="Data unit contoh (sintetis)" />}>
      <QueryView q={q}>
        {(f) => (
          <>
            <SectionTitle title="Jadwal terkonfirmasi" count={f.reservations.length} />
            <Card padded={false}>
              {f.reservations.length ? f.reservations.map((r, i) => (
                <View key={r.id} style={[styles.row, i < f.reservations.length - 1 && styles.divider]}>
                  <View style={styles.time}>
                    <Txt variant="bodyStrong" tabular>{formatTime(r.start).replace(' WIB', '')}</Txt>
                    <Txt variant="caption" tone="inkSecondary" tabular>{formatTime(r.end).replace(' WIB', '')}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{`${r.orderAlias} · unit ${r.unitCode}`}</Txt>
                    <Txt variant="caption" tone={r.driverName.startsWith('Belum') ? 'warnInk' : 'inkSecondary'}>{`${r.driverName} · ${formatShortDateTime(r.start)}`}</Txt>
                  </View>
                </View>
              )) : <EmptyBlock icon="calendar-blank-outline" title="Tidak ada reservasi" />}
            </Card>
            <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>Akhir reservasi sudah termasuk buffer 30 menit DEMO. Penawaran tidak menahan slot.</Txt>

            <SectionTitle title="Unit" count={f.units.length} />
            <View style={{ gap: space.md }}>
              {f.units.map((u) => (
                <Card key={u.unitId}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Icon name={u.status === 'active' ? 'tow-truck' : 'wrench-outline'} tone={u.status === 'active' ? 'accentInk' : 'dangerInk'} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>{`${u.code} · ${u.label}`}</Txt>
                    <Txt variant="caption" tone={u.status === 'active' ? 'okInk' : 'dangerInk'} style={{ fontWeight: '700' }}>{u.status === 'active' ? 'Beroperasi' : 'Out of service'}</Txt>
                  </View>
                  <Txt variant="caption" tone="inkSecondary">{u.ownership === 'partner' ? `Mitra kelolaan: ${u.partnerName}` : 'Unit sendiri'}</Txt>
                  <LineItem label="Kapasitas" value={<Txt variant="figure">{`${formatNumber(u.capacityKg)} kg`}</Txt>} />
                  <LineItem label="Dek" value={<Txt variant="bodySm">{u.deck}</Txt>} />
                  <LineItem label="Perlengkapan" value={<Txt variant="bodySm">{u.equipment.join(', ')}</Txt>} />
                  <LineItem label={u.ownership === 'partner' ? 'Quote mitra (termasuk BBM mitra)' : 'Biaya dasar'} hint={`Template ${u.costTemplate}`} value={<Money value={u.estimatedDirect} />} />
                  <LineItem label="Posisi terakhir" value={<Txt variant="bodySm" tone={u.positionFreshness === 'stale' ? 'warnInk' : 'ink'}>{`${u.positionAge}${u.positionFreshness === 'stale' ? ' (lama)' : ''}`}</Txt>} />
                  <Txt variant="caption" tone="inkSecondary">{`${u.reason} · sumber spesifikasi: ${u.specSource}`}</Txt>
                </Card>
              ))}
            </View>

            <SectionTitle title="Petugas" count={f.drivers.length} />
            <Card>
              {f.drivers.map((d) => <LineItem key={d.id} label={d.name} hint={d.roles.includes('owner') ? 'Owner merangkap driver' : d.roles.includes('partner') ? 'Mitra' : 'Driver'} value={<Txt variant="caption" tone={d.activeAssignment ? 'accentInk' : 'inkSecondary'}>{d.activeAssignment ?? 'Tersedia'}</Txt>} />)}
            </Card>
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, alignItems: 'center' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
  time: { width: 56 },
}));
