import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { color, space } from '@/core/design/tokens';
import { ApiError } from '@/data/api/contract';
import { ERROR_TITLE, errorMessage } from '@/data/api/hooks';
import { Txt } from './txt';
import { Icon } from './icon';
import { Button } from './button';

export function LoadingBlock({ label = 'Memuat…' }: { label?: string }) {
  return (
    <View style={styles.block} accessibilityLiveRegion="polite" accessible accessibilityLabel={label}>
      <ActivityIndicator color={color.carbon} />
      <Txt variant="bodySm" tone="inkSecondary">{label}</Txt>
    </View>
  );
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const code = error instanceof ApiError ? error.code : null;
  const icon = code === 'OFFLINE' ? 'wifi-off' : code === 'FORBIDDEN' ? 'lock-outline' : code === 'NOT_FOUND' ? 'file-question-outline' : 'alert-circle-outline';
  return (
    <View style={styles.block} accessibilityLiveRegion="polite">
      <Icon name={icon} size={28} tone="dangerInk" />
      <Txt variant="titleSm" align="center">{(code && ERROR_TITLE[code]) ?? 'Tidak dapat memuat'}</Txt>
      <Txt variant="bodySm" tone="inkSecondary" align="center">{errorMessage(error)}</Txt>
      {onRetry && (!(error instanceof ApiError) || error.retryable || code === 'UNAVAILABLE') ? (
        <Button label="Coba lagi" icon="refresh" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

export function EmptyBlock({ icon = 'inbox-outline', title, body, action }: { icon?: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Icon name={icon} size={28} tone="inkSecondary" />
      <Txt variant="bodyStrong" align="center">{title}</Txt>
      {body ? <Txt variant="bodySm" tone="inkSecondary" align="center">{body}</Txt> : null}
      {action}
    </View>
  );
}

/** Pola tunggal untuk state query: loading → gagal (dengan retry) → isi. */
export function QueryView<T>({ q, children, loadingLabel }: { q: UseQueryResult<T, unknown>; children: (data: T) => React.ReactNode; loadingLabel?: string }) {
  if (q.isPending) return <LoadingBlock label={loadingLabel} />;
  if (q.isError) return <ErrorBlock error={q.error} onRetry={() => void q.refetch()} />;
  return <>{children(q.data as T)}</>;
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
});
