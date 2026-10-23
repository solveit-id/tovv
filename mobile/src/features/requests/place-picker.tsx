import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, type, cardChrome, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useTheme } from '@/core/design/theme';
import { glideSpring, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon, IconTile } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { PressableScale } from '@/components/ui/pressable-scale';
import { HeaderIconButton } from '@/components/layout/app-header';
import { useToast } from '@/components/feedback/toast';
import type { PlaceBook } from '@/data/api/contract';
import type { Place } from '@/domain/types';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from '@/features/map/map-style';
import { t, tr } from '@/core/i18n';
import { currentPoint, ensureGeocoderAccess, placeFromPoint, useAddressSearch } from './geocode';
import { DemoStrip } from '@/components/layout/demo-strip';

export type PlaceField = 'pickup' | 'dropoff';

const COPY = {
  pickup: { title: 'Jemput di mana?', search: 'Cari lokasi mobil Anda', confirm: 'Jemput di sini', pin: 'pickup' },
  dropoff: { title: 'Antar ke mana?', search: 'Cari bengkel, rumah, atau alamat tujuan', confirm: 'Antar ke sini', pin: 'dropoff' },
} as const;

/** Area awal peta bila belum ada titik: pool operator demo (sintetis). */
const DEMO_CENTER = { lat: -7.2575, lng: 112.7521 };

const KIND_ICON: Record<PlaceBook['saved'][number]['kind'], { icon: string; tone: ColorToken; wash: ColorToken }> = {
  home: { icon: 'home-outline', tone: 'accentInk', wash: 'accentSoft' },
  work: { icon: 'briefcase-outline', tone: 'okInk', wash: 'okWash' },
  route: { icon: 'star-outline', tone: 'warnInk', wash: 'warnWash' },
  sample: { icon: 'map-marker-outline', tone: 'neutralInk', wash: 'neutralWash' },
};

function PlaceRow({ icon, tone = 'inkSecondary', wash = 'surfaceAlt', title, body, onPress, trailing }: { icon: string; tone?: ColorToken; wash?: ColorToken; title: string; body?: string; onPress: () => void; trailing?: React.ReactNode }) {
  const s = useStyles();
  return (
    <PressableScale depth="subtle" onPress={onPress} accessibilityRole="button" accessibilityLabel={body ? `${tr(title)}. ${body}` : tr(title)} style={s.row}>
      <IconTile name={icon} size={40} tone={tone} wash={wash} shape="circle" />
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>{title}</Txt>
        {body ? <Txt variant="caption" tone="inkSecondary" numberOfLines={2}>{body}</Txt> : null}
      </View>
      {trailing}
    </PressableScale>
  );
}

/**
 * Pemilih lokasi ala aplikasi ojek online: ketik untuk mencari alamat (layanan peta bawaan HP), pakai
 * lokasi sekarang, pilih tempat tersimpan atau yang terakhir dipakai, atau geser pin di peta.
 * Titik dari pencarian dan GPS selalu dikonfirmasi di peta dulu, lengkap dengan patokan untuk sopir.
 *
 * Satu Modal tetap terpasang saat berpindah dari jemput ke tujuan (isi diganti lewat `key`), karena
 * menutup lalu membuka Modal baru berdekatan bisa gagal tampil di iOS. Pita DEMO ikut tampil di dalam
 * Modal karena Modal adalah jendela terpisah. Pemanggil yang menutup (`onClose`) atau mengganti `field`.
 */
export function PlacePicker({ field, initial, book, onClose, onPick }: { field: PlaceField; initial: Place | null; book: PlaceBook | undefined; onClose: () => void; onPick: (p: Place) => void }) {
  const reduced = useReducedMotion();
  const backRef = useRef<(() => boolean) | null>(null);
  return (
    <Modal
      visible
      animationType={reduced ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!backRef.current?.()) onClose();
      }}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <PickerBody key={field} field={field} initial={initial} book={book} onClose={onClose} onPick={onPick} backRef={backRef} />
    </Modal>
  );
}

function PickerBody({ field, initial, book, onClose, onPick, backRef }: { field: PlaceField; initial: Place | null; book: PlaceBook | undefined; onClose: () => void; onPick: (p: Place) => void; backRef: React.RefObject<(() => boolean) | null> }) {
  const s = useStyles();
  const { c, scheme } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const copy = COPY[field];
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const search = useAddressSearch(confirm ? '' : query);

  // Back Android: dari konfirmasi pin kembali ke pencarian dulu.
  useEffect(() => {
    backRef.current = () => {
      if (!confirm) return false;
      setConfirm(null);
      return true;
    };
  }, [backRef, confirm]);

  const local = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !book) return [];
    const all = [...book.recent, ...book.saved.map((x) => x.place)];
    return all.filter((p, i) => all.findIndex((x) => x.address === p.address) === i && `${p.label} ${p.address}`.toLowerCase().includes(q)).slice(0, 4);
  }, [query, book]);

  const locateMe = async () => {
    setLocating(true);
    const p = await currentPoint().catch(() => null);
    setLocating(false);
    if (p === 'denied') {
      toast.show(t('Izin lokasi ditolak. Cari alamatnya atau geser pin di peta.'), 'info');
      return;
    }
    if (!p) {
      toast.show(t('Lokasi HP belum terbaca. Coba lagi di tempat terbuka, atau geser pin di peta.'), 'info');
      return;
    }
    setConfirm(p);
  };

  const pickDirect = (p: Place) => onPick(p);

  const openMap = (p?: { lat: number | null; lng: number | null } | null) => {
    if (p && p.lat !== null && p.lng !== null) setConfirm({ lat: p.lat, lng: p.lng });
    else if (initial && initial.lat !== null && initial.lng !== null) setConfirm({ lat: initial.lat, lng: initial.lng });
    else setConfirm(DEMO_CENTER);
  };

  return (
    <View style={s.root}>
      <DemoStrip interactive={false} />
      <View style={{ flex: 1 }}>
        {confirm ? (
          <PinConfirm
            field={field}
            start={confirm}
            initialNote={initial?.note ?? ''}
            onBack={() => setConfirm(null)}
            onConfirm={(p) => pickDirect(p)}
            scheme={scheme}
          />
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
            <View style={s.top}>
              <HeaderIconButton icon="close" label="Tutup" onPress={onClose} tone="ink" />
              <Txt variant="headline" accessibilityRole="header" style={{ flex: 1 }}>{copy.title}</Txt>
            </View>
            <View style={s.searchBox}>
              <View style={s.searchDot}>
                {field === 'dropoff' ? <Icon name="map-marker" size={18} tone="dangerInk" /> : <View style={s.pickupDot} />}
              </View>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder={tr(copy.search)}
                placeholderTextColor={c.inkMuted}
                selectionColor={c.accent}
                cursorColor={c.accent}
                keyboardAppearance={scheme}
                returnKeyType="search"
                accessibilityLabel={tr(copy.search)}
                style={s.searchInput}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr('Hapus teks')}>
                  <Icon name="close-circle" size={20} tone="inkMuted" />
                </Pressable>
              ) : null}
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
              <View style={s.quick}>
                <PressableScale depth="subtle" onPress={() => void locateMe()} accessibilityRole="button" accessibilityLabel={tr('Pakai lokasi saya sekarang')} style={s.quickBtn}>
                  {locating ? <ActivityIndicator color={c.accentInk} /> : <Icon name="crosshairs-gps" size={20} tone="accentInk" />}
                  <Txt variant="bodySm" tone="accentInk" bold numberOfLines={1}>Lokasi saya</Txt>
                </PressableScale>
                <PressableScale depth="subtle" onPress={() => openMap(null)} accessibilityRole="button" accessibilityLabel={tr('Pilih lewat peta')} style={s.quickBtn}>
                  <Icon name="map-marker-radius-outline" size={20} tone="accentInk" />
                  <Txt variant="bodySm" tone="accentInk" bold numberOfLines={1}>Pilih di peta</Txt>
                </PressableScale>
              </View>

              {query.trim().length >= 2 ? (
                <View style={s.section}>
                  {local.map((p) => (
                    <PlaceRow key={`l-${p.address}`} icon="history" title={p.label} body={p.address} onPress={() => pickDirect(p)} />
                  ))}
                  {search.status === 'searching' ? (
                    <View style={s.status}><ActivityIndicator color={c.inkSecondary} /><Txt variant="bodySm" tone="inkSecondary">Mencari alamat…</Txt></View>
                  ) : search.status === 'done' ? (
                    search.results.length ? (
                      search.results.map((p) => <PlaceRow key={`g-${p.address}`} icon="map-marker-outline" title={p.label} body={p.address} onPress={() => openMap(p)} trailing={<Icon name="chevron-right" size={20} tone="inkMuted" />} />)
                    ) : (
                      <Txt variant="bodySm" tone="inkSecondary" style={s.note}>Alamatnya belum ketemu. Coba tulis nama jalan dan kotanya, atau pilih di peta.</Txt>
                    )
                  ) : search.status === 'denied' ? (
                    <Txt variant="bodySm" tone="inkSecondary" style={s.note}>Izinkan akses lokasi supaya alamat bisa dicari, atau pilih langsung di peta.</Txt>
                  ) : search.status === 'unavailable' ? (
                    <Txt variant="bodySm" tone="inkSecondary" style={s.note}>Pencarian alamat belum bisa dipakai di HP ini. Pilih di peta, atau pakai alamat yang Anda ketik.</Txt>
                  ) : null}
                  <PlaceRow
                    icon="pencil-outline"
                    title={t('Pakai "{0}"', [query.trim()])}
                    body={t('Tanpa titik peta. Operator akan memastikan lokasinya lewat telepon.')}
                    onPress={() => pickDirect({ label: query.trim(), address: query.trim(), lat: null, lng: null })}
                  />
                </View>
              ) : (
                <>
                  {book?.recent.length ? (
                    <View style={s.section}>
                      <Txt variant="label" tone="inkSecondary" style={s.sectionLabel}>Terakhir dipakai</Txt>
                      {book.recent.map((p) => (
                        <PlaceRow key={`r-${p.address}`} icon="history" title={p.label} body={p.address} onPress={() => pickDirect(p)} />
                      ))}
                    </View>
                  ) : null}
                  {book?.saved.length ? (
                    <View style={s.section}>
                      <Txt variant="label" tone="inkSecondary" style={s.sectionLabel}>Tempat tersimpan</Txt>
                      {book.saved.map((x) => {
                        const k = KIND_ICON[x.kind];
                        return <PlaceRow key={x.key} icon={k.icon} tone={k.tone} wash={k.wash} title={x.place.label} body={x.place.address} onPress={() => pickDirect(x.place)} />;
                      })}
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </View>
  );
}

/**
 * Konfirmasi titik: peta penuh dengan pin tetap di tengah. Geser peta untuk memindahkan titik; pin
 * terangkat saat digeser dan alamat dibaca ulang saat berhenti.
 */
function PinConfirm({ field, start, initialNote, onBack, onConfirm, scheme }: { field: PlaceField; start: { lat: number; lng: number }; initialNote: string; onBack: () => void; onConfirm: (p: Place) => void; scheme: 'light' | 'dark' }) {
  const s = useStyles();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState(start);
  const [place, setPlace] = useState<Place | null>(null);
  const [resolving, setResolving] = useState(true);
  const [note, setNote] = useState(initialNote);
  const lift = useSharedValue(0);
  const seq = useRef(0);
  const copy = COPY[field];

  const [access, setAccess] = useState(false);
  // Di Android alamat baru bisa dibaca setelah izin lokasi; minta sekali saat konfirmasi pin dibuka.
  useEffect(() => {
    void ensureGeocoderAccess(true).then(setAccess);
  }, []);

  useEffect(() => {
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      const p = await placeFromPoint(center.lat, center.lng);
      if (id === seq.current) {
        setPlace(p);
        setResolving(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [center, access]);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * 10 }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: 0.35 - lift.value * 0.15, transform: [{ scale: 1 - lift.value * 0.3 }] }));

  const onRegionChange = () => {
    if (lift.value === 0) {
      lift.value = reduced ? 1 : withTiming(1, { duration: 120 });
      setResolving(true);
    }
  };
  const onRegionChangeComplete = (r: Region) => {
    lift.value = reduced ? 0 : withSpring(0, glideSpring);
    setCenter({ lat: r.latitude, lng: r.longitude });
  };

  const recenter = async () => {
    const p = await currentPoint().catch(() => null);
    if (p === 'denied' || !p) {
      toast.show(t('Lokasi HP belum bisa dibaca.'), 'info');
      return;
    }
    mapRef.current?.animateCamera({ center: { latitude: p.lat, longitude: p.lng }, zoom: 17 }, { duration: reduced ? 0 : 400 });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={{ latitude: start.lat, longitude: start.lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
          customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          userInterfaceStyle={scheme}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onRegionChange={onRegionChange}
          onRegionChangeComplete={onRegionChangeComplete}
        />
        <View style={s.pinLayer} pointerEvents="none">
          <Animated.View style={[s.pinShadow, shadowStyle]} />
          <Animated.View style={[s.pin, pinStyle]}>
            {field === 'pickup' ? (
              <View style={s.pickupPin}><View style={s.pickupPinDot} /></View>
            ) : (
              <Icon name="map-marker" size={46} tone="dangerInk" />
            )}
            {field === 'pickup' ? <View style={s.pinStem} /> : null}
          </Animated.View>
        </View>
        <View style={s.mapTop} pointerEvents="box-none">
          <HeaderIconButton icon="arrow-left" label="Kembali ke pencarian" onPress={onBack} tone="ink" />
          <View style={s.hint}><Txt variant="caption" bold>Geser peta untuk memindahkan pin</Txt></View>
        </View>
        <PressableScale depth="subtle" onPress={() => void recenter()} accessibilityRole="button" accessibilityLabel={t('Ke lokasi saya')} style={s.gps}>
          <Icon name="crosshairs-gps" size={22} tone="accentInk" />
        </PressableScale>
      </View>
      <KeyboardAvoidingView behavior="padding">
        <Animated.View entering={reduced ? undefined : FadeIn.duration(200)} style={[s.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={s.addr}>
            <IconTile name={field === 'pickup' ? 'map-marker-account-outline' : 'flag-checkered'} size={40} tone={field === 'pickup' ? 'accentInk' : 'dangerInk'} wash={field === 'pickup' ? 'accentSoft' : 'dangerWash'} shape="circle" />
            <View style={{ flex: 1, gap: 2 }} accessibilityLiveRegion="polite">
              {resolving || !place ? (
                <Txt variant="bodyStrong" tone="inkSecondary">Membaca alamat…</Txt>
              ) : (
                <>
                  <Txt variant="bodyStrong" numberOfLines={2}>{place.label}</Txt>
                  <Txt variant="caption" tone="inkSecondary" numberOfLines={2}>{place.address}</Txt>
                </>
              )}
            </View>
          </View>
          <Field label="Patokan untuk sopir (boleh dikosongkan)" value={note} onChangeText={setNote} placeholder="mis. depan minimarket, pagar hijau" icon="sign-direction" />
          <Button
            label={copy.confirm}
            size="lg"
            icon="check"
            disabled={resolving || !place}
            onPress={() => place && onConfirm({ ...place, note: note.trim() || null })}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  root: { flex: 1, backgroundColor: c.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: space.xs },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginHorizontal: space.lg, marginBottom: space.md, minHeight: 54, paddingHorizontal: space.md + 2, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 2, borderColor: c.accent },
  searchDot: { width: 20, alignItems: 'center' },
  pickupDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: c.accent, backgroundColor: c.surface },
  searchInput: { flex: 1, ...(type.body as object), color: c.ink, paddingVertical: space.sm },
  quick: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, minHeight: 48, borderRadius: radius.md, backgroundColor: c.accentSoft },
  section: { marginTop: space.lg, paddingHorizontal: space.lg },
  sectionLabel: { marginBottom: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  note: { paddingVertical: space.md },
  pinLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pin: { position: 'absolute', alignItems: 'center', bottom: '50%' },
  pinShadow: { position: 'absolute', width: 16, height: 6, borderRadius: 8, backgroundColor: c.shadow },
  pickupPin: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.surface },
  pickupPinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.surface },
  pinStem: { width: 3, height: 14, borderRadius: 2, backgroundColor: c.accent },
  mapTop: { position: 'absolute', top: space.sm, left: space.sm, right: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  hint: { flexShrink: 1, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: c.surface, ...cardChrome(c, scheme, 1) },
  gps: { position: 'absolute', right: space.lg, bottom: space.lg, width: 48, height: 48, borderRadius: 24, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', ...cardChrome(c, scheme, 2) },
  sheet: { backgroundColor: c.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, marginTop: -radius.xxl, paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.xs },
  addr: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
}));
