import React from 'react';
import { View } from 'react-native';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { Place } from '@/domain/types';
import { formatKm, straightKm } from '@/core/format/geo';
import { t, tr, useLocale } from '@/core/i18n';
import type { PlaceField } from './place-picker';

function Stop({ field, place, onPress, error }: { field: PlaceField; place: Place | null; onPress: () => void; error?: boolean }) {
  const s = useStyles();
  const empty = field === 'pickup' ? 'Jemput di mana?' : 'Antar ke mana?';
  const name = field === 'pickup' ? 'Lokasi jemput' : 'Tujuan';
  return (
    <PressableScale
      depth="subtle"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={place ? `${tr(name)}: ${place.label}, ${place.address}` : tr(empty)}
      accessibilityHint={tr('Ketuk untuk memilih atau mengganti lokasi')}
      style={s.stop}
    >
      <View style={s.marker}>{field === 'pickup' ? <View style={s.from} /> : <Icon name="map-marker" size={20} tone="dangerInk" />}</View>
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="caption" tone={error ? 'dangerInk' : 'inkSecondary'}>{name}</Txt>
        {place ? (
          <>
            <Txt variant="bodyStrong" numberOfLines={1}>{place.label}</Txt>
            <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>{place.address}</Txt>
            {place.note ? <Txt variant="caption" tone="accentInk" numberOfLines={1}>{t('Patokan: {0}', [place.note])}</Txt> : null}
          </>
        ) : (
          <Txt variant="bodyStrong" tone={error ? 'dangerInk' : 'inkMuted'}>{empty}</Txt>
        )}
      </View>
      <Icon name={place ? 'pencil-outline' : 'chevron-right'} size={18} tone="inkMuted" />
    </PressableScale>
  );
}

/**
 * Kartu rute ala aplikasi ojek online: jemput di atas, tujuan di bawah, dihubungkan titik-titik, dengan
 * tombol tukar. Menampilkan jarak garis lurus bila kedua titik punya koordinat.
 */
export function RouteCard({ pickup, dropoff, onEdit, onSwap, error }: { pickup: Place | null; dropoff: Place | null; onEdit: (f: PlaceField) => void; onSwap: () => void; error?: boolean }) {
  const s = useStyles();
  const locale = useLocale();
  const km = pickup?.lat != null && pickup.lng != null && dropoff?.lat != null && dropoff.lng != null ? straightKm({ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng }) : null;
  return (
    <View>
      <View style={[s.card, error && s.cardError]}>
        <Stop field="pickup" place={pickup} onPress={() => onEdit('pickup')} error={error && !pickup} />
        <View style={s.divider}>
          <View style={s.dots}>
            {[0, 1, 2].map((i) => <View key={i} style={s.dot} />)}
          </View>
          <View style={s.rule} />
          {pickup || dropoff ? (
            <PressableScale depth="subtle" onPress={onSwap} accessibilityRole="button" accessibilityLabel={t('Tukar lokasi jemput dan tujuan')} style={s.swap} hitSlop={6}>
              <Icon name="swap-vertical" size={20} tone="accentInk" />
            </PressableScale>
          ) : null}
        </View>
        <Stop field="dropoff" place={dropoff} onPress={() => onEdit('dropoff')} error={error && !dropoff} />
      </View>
      {km !== null ? (
        <View style={s.distance}>
          <Icon name="map-marker-distance" size={16} tone="inkSecondary" />
          <Txt variant="caption" tone="inkSecondary">{t('Sekitar {0} garis lurus. Jarak jalan biasanya lebih jauh.', [formatKm(km, locale)])}</Txt>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  card: { backgroundColor: c.surface, borderRadius: radius.xl, paddingHorizontal: space.lg, paddingVertical: space.xs, ...cardChrome(c, scheme, 1) },
  cardError: { borderWidth: 1.5, borderColor: c.dangerInk },
  stop: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 68, paddingVertical: space.sm },
  marker: { width: 22, alignItems: 'center' },
  from: { width: 14, height: 14, borderRadius: 7, borderWidth: 3.5, borderColor: c.accent, backgroundColor: c.surface },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md, height: 20 },
  dots: { width: 22, alignItems: 'center', gap: 3 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.lineStrong },
  rule: { flex: 1, height: 1, backgroundColor: c.line },
  swap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSoft, marginRight: -4 },
  distance: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm, paddingHorizontal: space.xs },
}));
