import { tr } from '@/core/i18n';
import React, { createContext, useContext, useEffect } from 'react';
import { View, useWindowDimensions, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { ApiError } from '@/data/api/contract';
import { ERROR_TITLE, errorMessage } from '@/data/api/hooks';
import { TowTruckArt } from '@/components/brand/tow-truck';
import { Txt } from './txt';
import { IconTile } from './icon';
import { Button } from './button';

const BAND = 140;

/** Satu penggerak kilau untuk semua bar dalam satu kerangka, supaya kilaunya serempak dan hemat. */
const ShimmerContext = createContext<SharedValue<number> | null>(null);

function useShimmerDriver(enabled = true) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (!reduced && enabled) p.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(p);
  }, [p, reduced, enabled]);
  return p;
}

/**
 * Bar kerangka dengan kilau lembut yang melintas selama menunggu data (hanya tampil saat memuat).
 * Tanpa kilau saat "kurangi gerakan".
 */
export function SkeletonBar({ width = '100%', height = 14, round, radius: r }: { width?: DimensionValue; height?: number; round?: boolean; radius?: number }) {
  const s = useStyles();
  const c = useColors();
  const reduced = useReducedMotion();
  const shared = useContext(ShimmerContext);
  const own = useShimmerDriver(!shared);
  const p = shared ?? own;
  const { width: screenW } = useWindowDimensions();
  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -BAND + p.value * (screenW + BAND) }] }));
  return (
    <View style={[s.bar, { width, height, borderRadius: r ?? (round ? height / 2 : radius.xs) }]}>
      {reduced ? null : (
        <Animated.View style={[s.band, band]} pointerEvents="none">
          <Svg width={BAND} height={height}>
            <Defs>
              <LinearGradient id="sk" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={c.skeletonGlow} stopOpacity="0" />
                <Stop offset="0.5" stopColor={c.skeletonGlow} stopOpacity="1" />
                <Stop offset="1" stopColor={c.skeletonGlow} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={BAND} height={height} fill="url(#sk)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

/** Kelompok kerangka: semua SkeletonBar di dalamnya berkilau bersama. */
export function SkeletonGroup({ children, label = 'Memuat…', style }: { children: React.ReactNode; label?: string; style?: ViewStyle }) {
  const p = useShimmerDriver();
  return (
    <ShimmerContext.Provider value={p}>
      <View style={style} accessible accessibilityLiveRegion="polite" accessibilityLabel={tr(label)}>
        {children}
      </View>
    </ShimmerContext.Provider>
  );
}

export type SkeletonKind = 'list' | 'order' | 'action' | 'hero' | 'detail';

function SkeletonShape({ kind }: { kind: SkeletonKind }) {
  const s = useStyles();
  if (kind === 'hero') {
    return (
      <View style={{ gap: 10 }}>
        <SkeletonBar width="45%" height={12} />
        <SkeletonBar width="70%" height={30} radius={8} />
        <View style={s.skelSplit}>
          <SkeletonBar width="40%" height={12} />
          <SkeletonBar width="40%" height={12} />
        </View>
      </View>
    );
  }
  if (kind === 'order') {
    return (
      <View style={s.skelCard}>
        <View style={s.skelSplit}>
          <SkeletonBar width={56} height={16} />
          <SkeletonBar width={96} height={20} round />
        </View>
        <SkeletonBar width="55%" height={14} />
        <View style={{ gap: 8, paddingLeft: 24 }}>
          <SkeletonBar width="80%" height={12} />
          <SkeletonBar width="65%" height={12} />
        </View>
        <SkeletonBar height={6} round />
        <SkeletonBar height={40} radius={radius.md} />
      </View>
    );
  }
  if (kind === 'action') {
    return (
      <View style={[s.skelCard, s.skelRow]}>
        <SkeletonBar width={40} height={40} radius={radius.md} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBar width="75%" height={14} />
          <SkeletonBar width="90%" height={12} />
          <SkeletonBar width={80} height={18} round />
        </View>
      </View>
    );
  }
  if (kind === 'detail') {
    return (
      <View style={{ gap: space.md }}>
        <View style={s.skelCard}>
          <SkeletonBar width={110} height={22} round />
          <SkeletonBar width="60%" height={22} />
          <SkeletonBar width="85%" height={12} />
          <SkeletonBar width="70%" height={12} />
        </View>
        <View style={s.skelCard}>
          <SkeletonBar width="40%" height={16} />
          <SkeletonBar height={12} />
          <SkeletonBar width="80%" height={12} />
        </View>
      </View>
    );
  }
  return (
    <View style={s.skelRow}>
      <SkeletonBar width={44} height={44} radius={radius.md} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBar width="70%" height={14} />
        <SkeletonBar width="45%" height={12} />
      </View>
    </View>
  );
}

/**
 * Kerangka berbentuk isi yang akan datang (kartu pekerjaan, tindakan, ringkasan, detail),
 * sehingga tata letak tidak melompat saat data tiba.
 */
export function LoadingBlock({ label = 'Memuat…', rows = 3, kind = 'list' }: { label?: string; rows?: number; kind?: SkeletonKind }) {
  const s = useStyles();
  const count = kind === 'hero' || kind === 'detail' ? 1 : rows;
  return (
    <SkeletonGroup label={label} style={kind === 'list' ? s.skel : s.skelStack}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonShape key={i} kind={kind} />
      ))}
    </SkeletonGroup>
  );
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const s = useStyles();
  const router = useRouter();
  const code = error instanceof ApiError ? error.code : null;
  const icon = code === 'OFFLINE' ? 'wifi-off' : code === 'FORBIDDEN' ? 'lock-outline' : code === 'NOT_FOUND' ? 'file-question-outline' : 'alert-circle-outline';
  return (
    <View style={s.block} accessibilityLiveRegion="polite">
      <IconTile name={icon} size={56} tone="dangerInk" wash="dangerWash" shape="circle" />
      <Txt variant="titleSm" align="center">{(code && ERROR_TITLE[code]) ?? 'Tidak dapat memuat'}</Txt>
      <Txt variant="bodySm" tone="inkSecondary" align="center">{errorMessage(error)}</Txt>
      {onRetry && (!(error instanceof ApiError) || error.retryable || code === 'UNAVAILABLE') ? (
        <Button label="Coba lagi" icon="refresh" variant="secondary" onPress={onRetry} compact />
      ) : null}
      {code === 'NOT_FOUND' ? (
        <>
          <Txt variant="caption" tone="inkSecondary" align="center">Tautannya mungkin sudah lama, atau data demo baru saja dikembalikan ke awal.</Txt>
          <Button label="Kembali" icon="arrow-left" variant="secondary" compact onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </>
      ) : null}
    </View>
  );
}

/** Keadaan kosong. `art` menampilkan ilustrasi unit derek (daftar pekerjaan/pesanan) sebagai ganti ikon. */
export function EmptyBlock({ icon = 'inbox-outline', title, body, action, art }: { icon?: string; title: string; body?: string; action?: React.ReactNode; art?: 'truck' | 'truck-loaded' }) {
  const s = useStyles();
  return (
    <View style={s.block}>
      {art ? <TowTruckArt width={150} loaded={art === 'truck-loaded'} /> : <IconTile name={icon} size={56} tone="inkSecondary" wash="surfaceAlt" shape="circle" />}
      <Txt variant="bodyStrong" align="center">{title}</Txt>
      {body ? <Txt variant="bodySm" tone="inkSecondary" align="center">{body}</Txt> : null}
      {action}
    </View>
  );
}

/** Pola tunggal untuk state query: kerangka → gagal (dengan coba lagi) → isi. */
export function QueryView<T>({ q, children, loadingLabel, skeletonRows, skeleton }: { q: UseQueryResult<T, unknown>; children: (data: T) => React.ReactNode; loadingLabel?: string; skeletonRows?: number; skeleton?: SkeletonKind }) {
  if (q.isPending) return <LoadingBlock label={loadingLabel} rows={skeletonRows} kind={skeleton} />;
  if (q.isError) return <ErrorBlock error={q.error} onRetry={() => void q.refetch()} />;
  return <>{children(q.data as T)}</>;
}

const useStyles = makeStyles((c) => ({
  block: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  bar: { backgroundColor: c.skeleton, overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, width: BAND },
  skel: { gap: space.lg, paddingVertical: space.md },
  skelStack: { gap: space.md },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  skelSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  skelCard: { gap: 10, padding: space.lg, borderRadius: radius.xl, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
}));
