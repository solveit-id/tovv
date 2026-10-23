import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles, useTheme } from '@/core/design/theme';
import { easeInOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon, IconTile } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ChipRow } from '@/components/ui/form';
import { LoadingBlock, ErrorBlock } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import type { LiveJob, LiveMapDTO, LiveUnit } from '@/data/api/contract';
import { executionStatus } from '@/core/i18n/status';
import { formatAge } from '@/core/format/time';
import { t } from '@/core/i18n';
import { PlaceMarker, TruckMarker } from './map-markers';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from './map-style';

const REFRESH_MS = 3000;
type Filter = 'all' | 'on_job' | 'available';

const TITLE = { owner: 'Peta armada', admin: 'Peta armada', driver: 'Peta tugas', customer: 'Lacak derek' } as const;

/** Titik "langsung" yang berdenyut pelan selama data masih baru; diam saat "kurangi gerakan". */
function LiveDot({ live }: { live: boolean }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (live && !reduced) o.value = withRepeat(withTiming(0.25, { duration: 900, easing: easeInOut }), -1, true);
    else o.value = 1;
    return () => cancelAnimation(o);
  }, [live, reduced, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[s.dot, live ? s.dotLive : s.dotStale, anim]} />;
}

function stateLabel(u: LiveUnit) {
  return u.state === 'on_job' ? 'Sedang bertugas' : u.state === 'available' ? 'Siap dipakai' : 'Tidak beroperasi';
}

/** Kartu unit (owner) di karosel bawah. */
function UnitCard({ unit, job, width, onOpen, now }: { unit: LiveUnit; job: LiveJob | undefined; width: number; onOpen: () => void; now: string }) {
  const s = useStyles();
  return (
    <View style={[s.card, { width }]}>
      <View style={s.cardHead}>
        <IconTile name="tow-truck" size={44} tone={unit.state === 'on_job' ? 'accentInk' : unit.state === 'available' ? 'okInk' : 'neutralInk'} wash={unit.state === 'on_job' ? 'accentSoft' : unit.state === 'available' ? 'okWash' : 'neutralWash'} />
        <View style={{ flex: 1 }}>
          <Txt variant="titleSm" numberOfLines={1}>{`${unit.code} · ${unit.label}`}</Txt>
          <Txt variant="caption" tone={unit.state === 'on_job' ? 'accentInk' : unit.state === 'available' ? 'okInk' : 'inkSecondary'} bold>{stateLabel(unit)}</Txt>
        </View>
      </View>
      {job ? (
        <Txt variant="bodySm" numberOfLines={2}>{t('{0} · {1} → {2}', [job.alias, job.pickup.label, job.dropoff.label])}</Txt>
      ) : (
        <Txt variant="bodySm" tone="inkSecondary">Tidak ada pekerjaan yang sedang jalan.</Txt>
      )}
      <View style={s.metaRow}>
        <Icon name={unit.freshness === 'live' ? 'crosshairs-gps' : 'clock-alert-outline'} size={14} tone={unit.freshness === 'live' ? 'okInk' : 'warnInk'} />
        <Txt variant="caption" tone={unit.freshness === 'live' ? 'inkSecondary' : 'warnInk'} style={{ flex: 1 }} numberOfLines={1}>
          {t('Posisi {0} · simulasi{1}', [formatAge(unit.capturedAt, now), unit.driverName ? t(' · sopir {0}', [unit.driverName]) : ''])}
        </Txt>
      </View>
      {job ? <Button label="Buka pekerjaan" variant="secondary" compact icon="arrow-right" onPress={onOpen} /> : null}
    </View>
  );
}

/** Kartu pekerjaan (driver/pelanggan): progres, perkiraan tiba, atau alasan lokasi belum tampil. */
function JobCard({ job, width, onOpen, customer }: { job: LiveJob; width: number; onOpen: () => void; customer: boolean }) {
  const s = useStyles();
  const look = executionStatus[job.status];
  return (
    <View style={[s.card, { width }]}>
      <View style={s.cardHead}>
        <IconTile name={job.trackingVisible ? 'navigation-variant' : 'map-clock-outline'} size={44} />
        <View style={{ flex: 1 }}>
          <Txt variant="titleSm" numberOfLines={1}>{t('{0} · {1}', [job.alias, look.label])}</Txt>
          <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>{t('{0} → {1}', [job.pickup.label, job.dropoff.label])}</Txt>
        </View>
      </View>
      {job.trackingVisible ? (
        <>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round((job.progress ?? 0) * 100)}%` }]} />
          </View>
          <Txt variant="bodySm">
            {job.etaMinutes !== null ? t('Perkiraan tiba sekitar {0} menit lagi', [job.etaMinutes]) : t('Sedang dalam perjalanan')}
            {customer && job.driverName ? t(' · sopir {0}', [job.driverName]) : ''}
          </Txt>
          <Txt variant="caption" tone="inkSecondary">Perkiraan kasar dari jarak garis lurus; belum menghitung macet.</Txt>
        </>
      ) : (
        <Txt variant="bodySm" tone="inkSecondary">{job.hiddenReason ?? 'Lokasi belum tersedia.'}</Txt>
      )}
      <Button label="Lihat detail" variant="secondary" compact icon="arrow-right" onPress={onOpen} />
    </View>
  );
}

/**
 * Peta langsung: owner melihat semua unit, driver tugasnya, pelanggan derek yang menuju kendaraannya.
 * Data diperbarui tiap 3 detik; penanda truk meluncur halus. Ketuk penanda untuk memilih kartunya,
 * geser kartu untuk memindahkan kamera.
 */
export function LiveMapScreen() {
  const s = useStyles();
  const { c, scheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<ScrollViewInstance>(null);
  const fitted = useRef(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState(0);
  const [myLocation, setMyLocation] = useState(false);
  const q = useTovvQuery(['live-map'], (api) => api.getLiveMap(), { refetchInterval: REFRESH_MS });
  const data: LiveMapDTO | undefined = q.data;
  const view = data?.view ?? 'owner';
  const fleet = view === 'owner' || view === 'admin';

  const units = useMemo(() => {
    const list = data?.units ?? [];
    const order = { on_job: 0, available: 1, out_of_service: 2 } as const;
    return [...list].filter((u) => filter === 'all' || u.state === filter).sort((a, b) => order[a.state] - order[b.state]);
  }, [data?.units, filter]);
  const jobs = data?.jobs ?? [];
  const items: ({ kind: 'unit'; unit: LiveUnit } | { kind: 'job'; job: LiveJob })[] = fleet
    ? units.map((unit) => ({ kind: 'unit' as const, unit }))
    : jobs.map((job) => ({ kind: 'job' as const, job }));

  const cardW = Math.min(width - space.lg * 2 - 24, 420);
  const step = cardW + space.md;

  const focusOf = (i: number) => {
    const it = items[i];
    if (!it) return null;
    if (it.kind === 'unit') return { latitude: it.unit.lat, longitude: it.unit.lng };
    const truck = data?.units.find((u) => u.orderId === it.job.orderId);
    if (truck) return { latitude: truck.lat, longitude: truck.lng };
    const p = it.job.pickup;
    return p.lat !== null && p.lng !== null ? { latitude: p.lat, longitude: p.lng } : null;
  };

  // Bingkai awal: semua titik terlihat, tidak tertutup header dan kartu.
  useEffect(() => {
    if (!data || fitted.current) return;
    const pts = [
      ...data.units.map((u) => ({ latitude: u.lat, longitude: u.lng })),
      ...data.jobs.flatMap((j) => [j.pickup, j.dropoff]).filter((p) => p.lat !== null && p.lng !== null).map((p) => ({ latitude: p.lat!, longitude: p.lng! })),
      ...(data.base ? [{ latitude: data.base.lat, longitude: data.base.lng }] : []),
    ];
    if (!pts.length) return;
    fitted.current = true;
    setTimeout(() => mapRef.current?.fitToCoordinates(pts, { edgePadding: { top: 160, right: 60, bottom: 300, left: 60 }, animated: !reduced }), 300);
  }, [data, reduced]);

  const select = (i: number, scroll: boolean) => {
    setSelected(i);
    const f = focusOf(i);
    if (f) mapRef.current?.animateCamera({ center: f, zoom: 14 }, { duration: reduced ? 0 : 600 });
    if (scroll) listRef.current?.scrollTo({ x: i * step, animated: !reduced });
  };

  const onCardsEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / step);
    if (i !== selected) select(i, false);
  };

  const showMe = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return;
    setMyLocation(true);
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
    if (fix) mapRef.current?.animateCamera({ center: { latitude: fix.coords.latitude, longitude: fix.coords.longitude }, zoom: 14 }, { duration: reduced ? 0 : 600 });
  };

  const openDirections = (job: LiveJob) => {
    const target = ['en_route_pickup', 'arrived_pickup', 'confirmed', 'assigned'].includes(job.status) ? job.pickup : job.dropoff;
    if (target.lat === null || target.lng === null) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${target.lat},${target.lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`,
    });
    void Linking.openURL(url);
  };

  const latestAge = data?.units.length ? Math.min(...data.units.map((u) => u.ageSeconds)) : null;
  const live = latestAge !== null && latestAge <= 90;
  const selectedJob = items[selected]?.kind === 'job' ? (items[selected] as { job: LiveJob }).job : null;

  return (
    <View style={s.root}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ latitude: -7.29, longitude: 112.74, latitudeDelta: 0.25, longitudeDelta: 0.25 }}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        userInterfaceStyle={scheme}
        showsUserLocation={myLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled
        mapPadding={{ top: 120, right: 0, bottom: 260, left: 0 }}
      >
        {data?.base ? <PlaceMarker kind="base" lat={data.base.lat} lng={data.base.lng} label={data.base.label} /> : null}
        {jobs.map((j) => {
          if (j.pickup.lat === null || j.pickup.lng === null || j.dropoff.lat === null || j.dropoff.lng === null) return null;
          const a = { latitude: j.pickup.lat, longitude: j.pickup.lng };
          const b = { latitude: j.dropoff.lat, longitude: j.dropoff.lng };
          const truck = data?.units.find((u) => u.orderId === j.orderId);
          return (
            <React.Fragment key={j.orderId}>
              <Polyline coordinates={[a, b]} strokeColor={c.lineStrong} strokeWidth={4} lineDashPattern={[8, 8]} />
              {truck ? <Polyline coordinates={[a, { latitude: truck.lat, longitude: truck.lng }]} strokeColor={c.accent} strokeWidth={5} /> : null}
              <PlaceMarker kind="pickup" lat={a.latitude} lng={a.longitude} label={j.pickup.label} />
              <PlaceMarker kind="dropoff" lat={b.latitude} lng={b.longitude} label={j.dropoff.label} />
            </React.Fragment>
          );
        })}
        {(data?.units ?? []).map((u) => (
          <TruckMarker
            key={u.unitId}
            unit={u}
            selected={fleet ? units[selected]?.unitId === u.unitId : selectedJob?.orderId === u.orderId}
            onPress={() => {
              const i = fleet ? units.findIndex((x) => x.unitId === u.unitId) : jobs.findIndex((j) => j.orderId === u.orderId);
              if (i >= 0) select(i, true);
            }}
          />
        ))}
      </MapView>

      <Animated.View entering={reduced ? undefined : FadeInDown.duration(320)} style={[s.header, { top: space.md }]}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Txt variant="headline">{TITLE[view]}</Txt>
            <View style={s.liveRow}>
              <LiveDot live={live} />
              <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>
                {q.isPending ? t('Memuat posisi…') : live ? t('Langsung · diperbarui tiap 3 detik · posisi simulasi') : t('Posisi terakhir sudah lama · simulasi')}
              </Txt>
            </View>
          </View>
          {view === 'driver' ? (
            <PressableScale depth="subtle" onPress={() => void showMe()} accessibilityRole="button" accessibilityLabel={t('Tampilkan lokasi saya')} style={s.roundBtn}>
              <Icon name="crosshairs-gps" size={22} tone="accentInk" />
            </PressableScale>
          ) : null}
        </View>
        {fleet ? (
          <ChipRow<Filter>
            label={t('Saring unit')}
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setSelected(0);
              listRef.current?.scrollTo({ x: 0, animated: false });
            }}
            options={[
              { value: 'all', label: t('Semua ({0})', [data?.units.length ?? 0]) },
              { value: 'on_job', label: t('Bertugas') },
              { value: 'available', label: t('Siap') },
            ]}
          />
        ) : null}
      </Animated.View>

      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, space.md) }]} pointerEvents="box-none">
        {q.isPending ? (
          <View style={[s.card, { width: width - space.lg * 2, alignSelf: 'center' }]}><LoadingBlock rows={1} label={t('Memuat posisi…')} /></View>
        ) : q.isError ? (
          <View style={[s.card, { width: width - space.lg * 2, alignSelf: 'center' }]}><ErrorBlock error={q.error} onRetry={() => void q.refetch()} /></View>
        ) : items.length === 0 ? (
          <View style={[s.card, { width: width - space.lg * 2, alignSelf: 'center' }]}>
            <Txt variant="titleSm">{fleet ? t('Tidak ada unit di pilihan ini') : view === 'driver' ? t('Belum ada tugas aktif') : t('Belum ada derek yang menuju Anda')}</Txt>
            <Txt variant="bodySm" tone="inkSecondary">
              {fleet ? t('Coba pilih "Semua".') : view === 'driver' ? t('Tugas baru muncul di peta setelah Anda menerimanya.') : t('Lokasi truk muncul di sini setelah sopir berangkat ke tempat Anda.')}
            </Txt>
          </View>
        ) : (
          <ScrollView
            ref={listRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={step}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}
            onMomentumScrollEnd={onCardsEnd}
          >
            {items.map((it, i) =>
              it.kind === 'unit' ? (
                <UnitCard key={it.unit.unitId} unit={it.unit} width={cardW} now={data?.generatedAt ?? it.unit.capturedAt} job={jobs.find((j) => j.orderId === it.unit.orderId)} onOpen={() => it.unit.orderId && router.push(`/order/${it.unit.orderId}`)} />
              ) : (
                <View key={it.job.orderId} style={{ gap: space.sm }}>
                  <JobCard job={it.job} width={cardW} customer={view === 'customer'} onOpen={() => router.push(`/order/${it.job.orderId}`)} />
                  {view === 'driver' && i === selected && it.job.pickup.lat !== null ? (
                    <Button label={t('Buka navigasi')} icon="navigation-variant-outline" onPress={() => openDirections(it.job)} />
                  ) : null}
                </View>
              ),
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  root: { flex: 1, backgroundColor: c.bg },
  map: { flex: 1 },
  header: { position: 'absolute', left: space.lg, right: space.lg, backgroundColor: c.surface, borderRadius: radius.xl, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs, ...cardChrome(c, scheme, 3) },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotLive: { backgroundColor: c.okInk },
  dotStale: { backgroundColor: c.warnInk },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: { backgroundColor: c.surface, borderRadius: radius.xl, padding: space.lg, gap: space.sm, ...cardChrome(c, scheme, 3) },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: c.accent },
}));
