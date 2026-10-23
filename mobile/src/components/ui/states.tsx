import { tr } from '@/core/i18n';
import React, { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import type { UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { easeInOut, useReducedMotion } from '@/core/design/motion';
import { ApiError } from '@/data/api/contract';
import { ERROR_TITLE, errorMessage } from '@/data/api/hooks';
import { Txt } from './txt';
import { IconTile } from './icon';
import { Button } from './button';

/** Bar kerangka yang berdenyut pelan selama memuat (bukan loop dekoratif: hanya tampil saat menunggu data). */
export function SkeletonBar({ width = '100%', height = 14, round }: { width?: DimensionValue; height?: number; round?: boolean }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (!reduced) o.value = withRepeat(withTiming(0.45, { duration: 750, easing: easeInOut }), -1, true);
    return () => cancelAnimation(o);
  }, [o, reduced]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[s.bar, { width, height, borderRadius: round ? height / 2 : radius.xs }, anim]} />;
}

/** Kerangka kartu daftar: menggantikan spinner agar tata letak tidak melompat saat data tiba. */
export function LoadingBlock({ label = 'Memuat…', rows = 3 }: { label?: string; rows?: number }) {
  const s = useStyles();
  return (
    <View style={s.skel} accessibilityLiveRegion="polite" accessible accessibilityLabel={tr(label)}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={s.skelRow}>
          <SkeletonBar width={44} height={44} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBar width="70%" height={14} />
            <SkeletonBar width="45%" height={12} />
          </View>
        </View>
      ))}
    </View>
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

export function EmptyBlock({ icon = 'inbox-outline', title, body, action }: { icon?: string; title: string; body?: string; action?: React.ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.block}>
      <IconTile name={icon} size={56} tone="inkSecondary" wash="surfaceAlt" shape="circle" />
      <Txt variant="bodyStrong" align="center">{title}</Txt>
      {body ? <Txt variant="bodySm" tone="inkSecondary" align="center">{body}</Txt> : null}
      {action}
    </View>
  );
}

/** Pola tunggal untuk state query: kerangka → gagal (dengan coba lagi) → isi. */
export function QueryView<T>({ q, children, loadingLabel, skeletonRows }: { q: UseQueryResult<T, unknown>; children: (data: T) => React.ReactNode; loadingLabel?: string; skeletonRows?: number }) {
  if (q.isPending) return <LoadingBlock label={loadingLabel} rows={skeletonRows} />;
  if (q.isError) return <ErrorBlock error={q.error} onRetry={() => void q.refetch()} />;
  return <>{children(q.data as T)}</>;
}

const useStyles = makeStyles((c) => ({
  block: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  bar: { backgroundColor: c.skeleton },
  skel: { gap: space.lg, paddingVertical: space.md },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
}));
