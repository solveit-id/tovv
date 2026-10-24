import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { FadeIn, FadeOut, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles, useTheme } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon, IconTile } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ChipRow } from '@/components/ui/form';
import { ErrorBlock } from '@/components/ui/states';
import { StatusTag } from '@/components/ui/status-tag';
import { RouteRail } from '@/components/business/route-rail';
import { TowLoader } from '@/components/brand/tow-truck';
import { usePermission } from '@/components/feedback/permissions';
import { useTovvQuery } from '@/data/api/hooks';
import type { LiveJob, LiveMapDTO, LiveUnit } from '@/data/api/contract';
import { executionStatus } from '@/core/i18n/status';
import { addMinutes, formatAge, formatTime } from '@/core/format/time';
import { bearing, formatKm, straightKm } from '@/core/format/geo';
import { t, useLocale } from '@/core/i18n';
import { PlaceMarker, TruckMarker } from './map-markers';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from './map-style';

/** Jeda pembaruan posisi. Penanda meluncur selama jeda yang sama, jadi gerakannya terlihat terus-menerus. */
const REFRESH_MS = 2000;
type Filter = 'all' | 'on_job' | 'available';
type Item = { kind: 'unit'; unit: LiveUnit } | { kind: 'job'; job: LiveJob };

const TITLE = { owner: 'Peta armada', admin: 'Peta armada', driver: 'Peta tugas', customer: 'Lacak towing' } as const;
const PRE_LOAD = ['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup'];

const coord = (p: { lat: number; lng: number }) => ({ latitude: p.lat, longitude: p.lng });
const hasPoint = (p: { lat: number | null; lng: number | null }): p is { lat: number; lng: number } => p.lat !== null && p.lng !== null;

/** Penanda "langsung": titik hijau dengan riak pelan selama data masih baru; kuning dan diam bila lama. */
function LiveBadge({ live, pending }: { live: boolean; pending: boolean }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const ripple = useSharedValue(0);
  useEffect(() => {
    if (live && !reduced) ripple.value = withRepeat(withTiming(1, { duration: 1600, easing: easeOut }), -1, false);
    else ripple.value = 0;
    return () => cancelAnimation(ripple);
  }, [live, reduced, ripple]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - ripple.value), transform: [{ scale: 1 + ripple.value * 1.6 }] }));
  return (
    <View style={[s.badge, live ? s.badgeLive : s.badgeStale]} accessibilityLiveRegion="polite">
      <View style={s.dotBox}>
        {live ? <Animated.View style={[s.dot, s.dotLive, StyleSheet.absoluteFill, ring]} /> : null}
        <View style={[s.dot, live ? s.dotLive : s.dotStale]} />
      </View>
      <Txt variant="caption" bold tone={live ? 'okInk' : 'warnInk'} maxFontSizeMultiplier={1.3}>
        {pending ? 'Memuat' : live ? 'Langsung' : 'Posisi lama'}
      </Txt>
    </View>
  );
}

function MapButton({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active?: boolean }) {
  const s = useStyles();
  return (
    <PressableScale depth="subtle" onPress={onPress} accessibilityRole="button" accessibilityLabel={t(label)} accessibilityState={active !== undefined ? { selected: active } : undefined} style={[s.mapBtn, active && s.mapBtnOn]}>
      <Icon name={icon} size={22} tone={active ? 'onAccent' : 'ink'} />
    </PressableScale>
  );
}

const STATE_LOOK = {
  on_job: { label: 'Sedang bertugas', icon: 'tow-truck', ink: 'accentInk', wash: 'accentSoft' },
  available: { label: 'Siap dipakai', icon: 'check-circle-outline', ink: 'okInk', wash: 'okWash' },
  out_of_service: { label: 'Tidak beroperasi', icon: 'wrench-outline', ink: 'neutralInk', wash: 'neutralWash' },
} as const;

/** Kartu unit (owner) di karosel bawah. */
const UnitCard = React.memo(function UnitCard({ unit, job, width, now, following, onOpen, onFollow }: { unit: LiveUnit; job: LiveJob | undefined; width: number; now: string; following: boolean; onOpen: (orderId: string) => void; onFollow: (unitId: string) => void }) {
  const s = useStyles();
  const look = STATE_LOOK[unit.state];
  return (
    <View style={[s.card, { width }]}>
      <View style={s.cardHead}>
        <IconTile name="tow-truck" size={44} tone={look.ink} wash={look.wash} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="titleSm" numberOfLines={1}>{`${unit.code} · ${unit.label}`}</Txt>
          <View style={s.metaRow}>
            <Icon name={look.icon} size={14} tone={look.ink} />
            <Txt variant="caption" tone={look.ink} bold numberOfLines={1} style={{ flexShrink: 1 }}>{unit.driverName ? t('{0} · {1}', [t(look.label), unit.driverName]) : look.label}</Txt>
          </View>
        </View>
      </View>
      {job && job.trackingVisible && job.etaMinutes !== null ? (
        <View style={s.eta}>
          <Icon name="clock-fast" size={18} tone="accentInk" />
          <Txt variant="bodyStrong" tone="accentInk" style={{ flex: 1 }} numberOfLines={2}>
            {t('{0} tiba ±{1} mnt ({2}) {3}', [job.alias, job.etaMinutes, formatTime(addMinutes(now, job.etaMinutes)), PRE_LOAD.includes(job.status) ? t('di lokasi jemput') : t('di tujuan')])}
          </Txt>
        </View>
      ) : null}
      {job ? <RouteRail pickup={job.pickup} dropoff={job.dropoff} /> : <Txt variant="bodySm" tone="inkSecondary">Sedang tidak ada pekerjaan.</Txt>}
      <View style={s.metaRow}>
        <Icon name={unit.freshness === 'live' ? 'crosshairs-gps' : 'clock-alert-outline'} size={14} tone={unit.freshness === 'live' ? 'okInk' : 'warnInk'} />
        <Txt variant="caption" tone={unit.freshness === 'live' ? 'inkSecondary' : 'warnInk'} style={{ flex: 1 }} numberOfLines={1}>
          {t('Posisi {0} · simulasi', [formatAge(unit.capturedAt, now)])}
        </Txt>
      </View>
      <View style={s.btnRow}>
        <Button label={following ? 'Sedang diikuti' : 'Ikuti di peta'} icon="crosshairs" variant={following ? 'primary' : 'secondary'} compact style={{ flex: 1 }} onPress={() => onFollow(unit.unitId)} />
        {job ? <Button label="Pekerjaan" variant="secondary" compact icon="arrow-right" style={{ flex: 1 }} onPress={() => onOpen(job.orderId)} /> : null}
      </View>
    </View>
  );
});

/** Kartu pekerjaan (driver/pelanggan): perkiraan tiba, progres dengan truk, sisa jarak garis lurus, rute. */
const JobCard = React.memo(function JobCard({ job, truck, width, now, view, onOpen }: { job: LiveJob; truck: LiveUnit | undefined; width: number; now: string; view: LiveMapDTO['view']; onOpen: (orderId: string) => void }) {
  const s = useStyles();
  const locale = useLocale();
  const look = executionStatus[job.status];
  const target = PRE_LOAD.includes(job.status) ? job.pickup : job.dropoff;
  const km = truck && hasPoint(target) ? straightKm(truck, target) : null;
  const pct = Math.round((job.progress ?? 0) * 100);
  const openDirections = () => {
    if (!hasPoint(target)) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${target.lat},${target.lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`,
    });
    void Linking.openURL(url);
  };
  return (
    <View style={[s.card, { width }]}>
      <View style={s.cardHead}>
        <Txt variant="titleSm" style={{ flex: 1 }} numberOfLines={1}>{job.alias}</Txt>
        <StatusTag look={look} size="sm" />
      </View>
      {job.trackingVisible ? (
        <>
          <View style={s.etaRow}>
            <Txt variant="figureLg" tabular>{job.etaMinutes !== null ? t('{0} mnt', [job.etaMinutes]) : '—'}</Txt>
            <Txt variant="bodySm" tone="inkSecondary" style={{ flex: 1 }} numberOfLines={2}>
              {job.etaMinutes !== null ? t('tiba sekitar {0}', [formatTime(addMinutes(now, job.etaMinutes))]) : t('Sedang dalam perjalanan')}
              {view === 'customer' && job.driverName ? t(' · sopir {0}', [job.driverName]) : ''}
            </Txt>
          </View>
          <View style={s.progressTrack} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
            <View style={[s.progressFill, { width: `${pct}%` }]} />
            <View style={[s.progressTruck, { left: `${pct}%` }]}>
              <Icon name="tow-truck" size={14} tone="onAccent" />
            </View>
          </View>
          <Txt variant="caption" tone="inkSecondary">
            {km !== null ? t('Sekitar {0} lagi (jarak lurus, belum termasuk macet).', [formatKm(km, locale)]) : t('Perkiraan kasar, belum termasuk macet.')}
          </Txt>
        </>
      ) : (
        <View style={s.hidden}>
          <Icon name="map-clock-outline" size={18} tone="inkSecondary" />
          <Txt variant="bodySm" tone="inkSecondary" style={{ flex: 1 }}>{job.hiddenReason ?? 'Lokasi belum tersedia.'}</Txt>
        </View>
      )}
      <RouteRail pickup={job.pickup} dropoff={job.dropoff} />
      <View style={s.btnRow}>
        <Button label="Detail" variant="secondary" compact icon="text-box-outline" style={{ flex: 1 }} onPress={() => onOpen(job.orderId)} />
        {view === 'driver' && hasPoint(target) ? <Button label="Navigasi" variant="mode" compact icon="navigation-variant-outline" style={{ flex: 1 }} onPress={openDirections} /> : null}
      </View>
    </View>
  );
});

/**
 * Rute satu pekerjaan: garis dasar bertepi, ruas yang sudah ditempuh utuh biru, sisanya putus-putus.
 * Titik pisah mengikuti posisi truk setelah truk selesai meluncur ke sana, jadi garis biru tidak
 * pernah mendahului truk.
 */
const RouteLines = React.memo(function RouteLines({ job, truck, glideMs }: { job: LiveJob; truck: { lat: number; lng: number } | null; glideMs: number }) {
  const { c } = useTheme();
  const [trail, setTrail] = useState(truck);
  useEffect(() => {
    const timer = setTimeout(() => setTrail(truck), glideMs);
    return () => clearTimeout(timer);
  }, [truck?.lat, truck?.lng, glideMs]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!hasPoint(job.pickup) || !hasPoint(job.dropoff)) return null;
  const a = coord(job.pickup);
  const b = coord(job.dropoff);
  const mid = trail ? coord(trail) : null;
  return (
    <>
      <Polyline coordinates={[a, b]} strokeColor={c.surface} strokeWidth={9} zIndex={1} />
      <Polyline coordinates={mid ? [mid, b] : [a, b]} strokeColor={c.inkMuted} strokeWidth={4} lineDashPattern={[10, 8]} zIndex={2} />
      {mid ? <Polyline coordinates={[a, mid]} strokeColor={c.accent} strokeWidth={6} zIndex={3} /> : null}
      <PlaceMarker kind="pickup" lat={job.pickup.lat} lng={job.pickup.lng} label={job.pickup.label} />
      <PlaceMarker kind="dropoff" lat={job.dropoff.lat} lng={job.dropoff.lng} label={job.dropoff.label} />
    </>
  );
});

/**
 * Peta langsung: owner melihat semua unit, driver tugasnya, pelanggan unit towing yang menuju kendaraannya.
 * Posisi diperbarui tiap 2 detik selama layar terbuka (berhenti saat pindah tab) dan truk meluncur
 * terus-menerus sambil menghadap arah jalannya. Ketuk truk untuk memilih kartunya, geser kartu untuk
 * memindahkan kamera, atau "Ikuti" agar kamera mengikuti truk.
 */
export function LiveMapScreen() {
  const s = useStyles();
  const { scheme } = useTheme();
  const router = useRouter();
  const ask = usePermission();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const focusedRef = useRef(false);
  const { width } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<ScrollViewInstance>(null);
  const fitted = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState(0);
  const [follow, setFollow] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [myLocation, setMyLocation] = useState(false);
  const [topH, setTopH] = useState(120);
  const [bottomH, setBottomH] = useState(260);
  // refetchInterval dibaca dari ref yang diatur listener fokus navigasi: listener tetap berjalan walau
  // layar tab dibekukan (freezeOnBlur), jadi peta benar-benar berhenti memuat saat tab ditinggalkan.
  const q = useTovvQuery(['live-map'], (api) => api.getLiveMap(), { refetchInterval: () => (focusedRef.current ? REFRESH_MS : false) });
  const refetch = q.refetch;
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      void refetch();
      return () => {
        focusedRef.current = false;
      };
    }, [refetch]),
  );
  const data: LiveMapDTO | undefined = q.data;
  const view = data?.view ?? 'owner';
  const fleet = view === 'owner' || view === 'admin';

  const units = useMemo(() => {
    const list = data?.units ?? [];
    const order = { on_job: 0, available: 1, out_of_service: 2 } as const;
    return [...list].filter((u) => filter === 'all' || u.state === filter).sort((a, b) => order[a.state] - order[b.state]);
  }, [data?.units, filter]);
  const jobs = useMemo(() => data?.jobs ?? [], [data?.jobs]);
  const items: Item[] = useMemo(
    () => (fleet ? units.map((unit) => ({ kind: 'unit' as const, unit })) : jobs.map((job) => ({ kind: 'job' as const, job }))),
    [fleet, units, jobs],
  );
  const truckOf = useCallback((orderId: string | null) => (orderId ? data?.units.find((u) => u.orderId === orderId) : undefined), [data?.units]);

  const cardW = Math.min(width - space.lg * 2 - 28, 420);
  const step = cardW + space.md;

  const focusOf = useCallback(
    (it: Item | undefined) => {
      if (!it) return null;
      if (it.kind === 'unit') return coord(it.unit);
      const truck = truckOf(it.job.orderId);
      if (truck) return coord(truck);
      return hasPoint(it.job.pickup) ? coord(it.job.pickup) : null;
    },
    [truckOf],
  );

  const allPoints = useCallback(() => {
    if (!data) return [];
    return [
      ...data.units.map(coord),
      ...data.jobs.flatMap((j) => [j.pickup, j.dropoff]).flatMap((p) => (hasPoint(p) ? [coord(p)] : [])),
      ...(data.base ? [coord(data.base)] : []),
    ];
  }, [data]);

  const fitAll = useCallback(() => {
    const pts = allPoints();
    if (!pts.length) return;
    setFollow(false);
    // mapPadding sudah menyisihkan header, tombol, dan kartu; edgePadding hanya jarak napas kecil.
    mapRef.current?.fitToCoordinates(pts, { edgePadding: { top: 32, right: 32, bottom: 32, left: 32 }, animated: !reduced });
  }, [allPoints, reduced]);

  // Bingkai awal: semua titik terlihat, tidak tertutup header dan kartu.
  useEffect(() => {
    if (!data || !mapReady || fitted.current) return;
    fitted.current = true;
    const timer = setTimeout(fitAll, 250);
    return () => clearTimeout(timer);
  }, [data, mapReady, fitAll]);

  // Mode ikuti: kamera bergeser bersama truk yang dipilih setiap kali posisinya diperbarui.
  const followTarget = follow ? focusOf(items[selected]) : null;
  useEffect(() => {
    if (!followTarget) return;
    mapRef.current?.animateCamera({ center: followTarget }, { duration: reduced ? 0 : REFRESH_MS });
  }, [followTarget?.latitude, followTarget?.longitude, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback(
    (i: number, scroll: boolean) => {
      setSelected(i);
      const f = focusOf(items[i]);
      if (f) mapRef.current?.animateCamera({ center: f, zoom: 14 }, { duration: reduced ? 0 : 500 });
      if (scroll) listRef.current?.scrollTo({ x: i * step, animated: !reduced });
    },
    [focusOf, items, reduced, step],
  );

  // Referensi terbaru untuk callback yang stabil, supaya penanda dan kartu yang di-memo tidak ikut digambar ulang.
  const itemsRef = useRef(items);
  const unitsRef = useRef<LiveUnit[]>([]);
  const selectRef = useRef(select);
  const selectedRef = useRef(selected);
  useLayoutEffect(() => {
    itemsRef.current = items;
    unitsRef.current = data?.units ?? [];
    selectRef.current = select;
    selectedRef.current = selected;
  });
  const onTruck = useCallback((unitId: string) => {
    const orderId = unitsRef.current.find((u) => u.unitId === unitId)?.orderId;
    const i = itemsRef.current.findIndex((it) => (it.kind === 'unit' ? it.unit.unitId === unitId : it.job.orderId === orderId));
    if (i >= 0) selectRef.current(i, true);
  }, []);
  const onOpen = useCallback((orderId: string) => router.push(`/order/${orderId}`), [router]);
  const onFollow = useCallback((unitId: string) => {
    const i = itemsRef.current.findIndex((it) => it.kind === 'unit' && it.unit.unitId === unitId);
    if (i < 0) return;
    setFollow((f) => !(f && selectedRef.current === i));
    selectRef.current(i, true);
  }, []);

  const onCardsEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.x / step)));
    if (i !== selected) select(i, false);
  };

  const showMe = async () => {
    if (!(await ask('location'))) return;
    setMyLocation(true);
    setFollow(false);
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
    if (fix) mapRef.current?.animateCamera({ center: { latitude: fix.coords.latitude, longitude: fix.coords.longitude }, zoom: 14 }, { duration: reduced ? 0 : 500 });
  };

  const latestAge = data?.units.length ? Math.min(...data.units.map((u) => u.ageSeconds)) : null;
  const live = latestAge !== null && latestAge <= 90;
  const selectedItem = items[selected];
  // Sorotan perkiraan tiba di header: driver/pelanggan = tugas/pesanan yang dipilih; owner = yang paling cepat tiba.
  const headline = useMemo(() => {
    const now = data?.generatedAt;
    if (!now) return null;
    const tracked = jobs.filter((j) => j.trackingVisible && j.etaMinutes !== null);
    const pick = fleet ? [...tracked].sort((a, b) => (a.etaMinutes ?? 0) - (b.etaMinutes ?? 0))[0] : (selectedItem?.kind === 'job' && selectedItem.job.trackingVisible ? selectedItem.job : tracked[0]);
    if (!pick || pick.etaMinutes === null) return null;
    const at = formatTime(addMinutes(now, pick.etaMinutes));
    const where = PRE_LOAD.includes(pick.status) ? t('lokasi jemput') : t('tujuan');
    if (view === 'customer') return { title: t('Towing tiba ±{0} mnt · sekitar {1}', [pick.etaMinutes, at]), body: t('Menuju {0} · perkiraan kasar, belum termasuk macet', [where]) };
    if (view === 'driver') return { title: t('Sampai {0} ±{1} mnt · {2}', [where, pick.etaMinutes, at]), body: t('{0} · perkiraan kasar dari jarak lurus', [pick.alias]) };
    return { title: t('{0} tiba paling cepat: ±{1} mnt · {2}', [pick.alias, pick.etaMinutes, at]), body: t('Menuju {0} · {1} pekerjaan dilacak', [where, tracked.length]) };
  }, [data?.generatedAt, jobs, fleet, selectedItem, view]);

  const counts = useMemo(() => {
    const list = data?.units ?? [];
    return { on: list.filter((u) => u.state === 'on_job').length, ready: list.filter((u) => u.state === 'available').length };
  }, [data?.units]);

  // Arah awal truk yang sedang bertugas: menuju tujuan pekerjaannya (sebelum ada perpindahan untuk dihitung).
  const headingFor = useCallback(
    (u: LiveUnit) => {
      const job = jobs.find((j) => j.orderId === u.orderId);
      if (!job) return null;
      const target = PRE_LOAD.includes(job.status) ? job.pickup : job.dropoff;
      return hasPoint(target) ? bearing(u, target) : null;
    },
    [jobs],
  );

  return (
    <View style={s.root}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ latitude: -7.29, longitude: 112.74, latitudeDelta: 0.25, longitudeDelta: 0.25 }}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        userInterfaceStyle={scheme}
        mapType={satellite ? 'hybrid' : 'standard'}
        showsUserLocation={myLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={() => setMapReady(true)}
        onPanDrag={follow ? () => setFollow(false) : undefined}
        mapPadding={{ top: topH, right: 64, bottom: bottomH, left: 0 }}
      >
        {data?.base ? <PlaceMarker kind="base" lat={data.base.lat} lng={data.base.lng} label={data.base.label} /> : null}
        {jobs.map((j) => {
          const truck = truckOf(j.orderId);
          return <RouteLines key={j.orderId} job={j} glideMs={REFRESH_MS} truck={truck ? { lat: truck.lat, lng: truck.lng } : null} />;
        })}
        {(data?.units ?? []).map((u) => (
          <TruckMarker
            key={u.unitId}
            unit={u}
            glideMs={REFRESH_MS}
            fallbackHeading={headingFor(u)}
            eta={jobs.find((j) => j.orderId === u.orderId && j.trackingVisible)?.etaMinutes ?? null}
            selected={selectedItem?.kind === 'unit' ? selectedItem.unit.unitId === u.unitId : selectedItem?.kind === 'job' ? selectedItem.job.orderId === u.orderId : false}
            onSelect={onTruck}
          />
        ))}
      </MapView>

      <View style={[s.top, { top: space.md }]} pointerEvents="box-none">
        <View style={s.header} onLayout={(e) => setTopH(e.nativeEvent.layout.height + space.md)}>
          <View style={s.headerRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="headline">{TITLE[view]}</Txt>
              <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>
                {fleet && data ? t('{0} bertugas · {1} siap · posisi simulasi', [counts.on, counts.ready]) : t('Posisi simulasi, diperbarui tiap 2 detik')}
              </Txt>
            </View>
            <LiveBadge live={live} pending={q.isPending} />
          </View>
          {headline ? (
            <View style={s.headEta}>
              <Icon name="clock-fast" size={20} tone="onAccent" />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" tone="onAccent" numberOfLines={2}>{headline.title}</Txt>
                <Txt variant="caption" tone="onAccent" numberOfLines={2} style={{ opacity: 0.9 }}>{headline.body}</Txt>
              </View>
            </View>
          ) : null}
          {fleet ? (
            <ChipRow<Filter>
              label={t('Saring unit')}
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setSelected(0);
                setFollow(false);
                listRef.current?.scrollTo({ x: 0, animated: false });
              }}
              options={[
                { value: 'all', label: t('Semua ({0})', [data?.units.length ?? 0]) },
                { value: 'on_job', label: t('Bertugas') },
                { value: 'available', label: t('Siap') },
              ]}
            />
          ) : null}
        </View>
      </View>
      <View style={[s.controls, { top: topH + space.sm }]} pointerEvents="box-none">
          <MapButton icon="fit-to-screen-outline" label="Lihat semua" onPress={fitAll} />
          <MapButton icon="crosshairs-gps" label="Tampilkan lokasi saya" onPress={() => void showMe()} />
          {items.length ? <MapButton icon="navigation-variant-outline" label="Ikuti truk" active={follow} onPress={() => setFollow((f) => !f)} /> : null}
          <MapButton icon="layers-outline" label="Ganti tampilan peta" active={satellite} onPress={() => setSatellite((v) => !v)} />
      </View>

      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, space.md) }]} pointerEvents="box-none" onLayout={(e) => setBottomH(e.nativeEvent.layout.height)}>
        {q.isPending ? null : q.isError ? (
          <View style={[s.card, s.wide, { width: width - space.lg * 2 }]}><ErrorBlock error={q.error} onRetry={() => void q.refetch()} /></View>
        ) : items.length === 0 ? (
          <View style={[s.card, s.wide, { width: width - space.lg * 2 }]}>
            <Txt variant="titleSm">{fleet ? t('Tidak ada unit di pilihan ini') : view === 'driver' ? t('Belum ada tugas aktif') : t('Belum ada unit towing yang menuju Anda')}</Txt>
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
            {items.map((it) =>
              it.kind === 'unit' ? (
                <UnitCard
                  key={it.unit.unitId}
                  unit={it.unit}
                  width={cardW}
                  now={data?.generatedAt ?? it.unit.capturedAt}
                  job={jobs.find((j) => j.orderId === it.unit.orderId)}
                  following={follow && selectedItem?.kind === 'unit' && selectedItem.unit.unitId === it.unit.unitId}
                  onOpen={onOpen}
                  onFollow={onFollow}
                />
              ) : (
                <JobCard key={it.job.orderId} job={it.job} truck={truckOf(it.job.orderId)} width={cardW} now={data?.generatedAt ?? ''} view={view} onOpen={onOpen} />
              ),
            )}
          </ScrollView>
        )}
      </View>

      {!mapReady || q.isPending ? (
        <Animated.View exiting={reduced ? undefined : FadeOut.duration(260)} entering={FadeIn.duration(120)} style={[StyleSheet.absoluteFill, s.loading]}>
          <TowLoader label={t('Menyiapkan peta…')} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  root: { flex: 1, backgroundColor: c.bg },
  map: { flex: 1 },
  loading: { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', left: space.lg, right: space.lg },
  header: { backgroundColor: c.surface, borderRadius: radius.xl, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs, ...cardChrome(c, scheme, 3) },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  badgeLive: { backgroundColor: c.okWash },
  badgeStale: { backgroundColor: c.warnWash, borderWidth: 1, borderStyle: 'dashed', borderColor: c.warnInk },
  dotBox: { width: 8, height: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotLive: { backgroundColor: c.okInk },
  dotStale: { backgroundColor: c.warnInk },
  controls: { position: 'absolute', right: space.lg, gap: space.sm },
  mapBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', ...cardChrome(c, scheme, 2) },
  mapBtnOn: { backgroundColor: c.accent, borderColor: c.accent },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wide: { alignSelf: 'center' },
  card: { backgroundColor: c.surface, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...cardChrome(c, scheme, 3) },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnRow: { flexDirection: 'row', gap: space.sm },
  etaRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  eta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm + 2, borderRadius: radius.md, backgroundColor: c.accentSoft },
  headEta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm, marginBottom: space.sm, borderRadius: radius.lg, backgroundColor: c.accent },
  hidden: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.md, backgroundColor: c.surfaceAlt },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt, marginVertical: 6 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: c.accent },
  progressTruck: { position: 'absolute', top: -8, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.surface },
}));
