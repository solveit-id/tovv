import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '@/core/design/tokens';

/**
 * Kerangka layar: header di atas, isi bergulir native (tanpa scroll-jacking), opsi tarik-untuk-muat-ulang,
 * dan area aksi tetap di bawah yang tetap terjangkau ibu jari serta naik bersama keyboard.
 */
export function Screen({
  header,
  children,
  footer,
  onRefresh,
  scroll = true,
  contentStyle,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onRefresh?: () => Promise<unknown>;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: footer ? space.xxl : space.huge + insets.bottom }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={color.carbon}
            colors={[color.carbon]}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await onRefresh();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      {body}
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.lg },
  footer: {
    backgroundColor: color.sheet,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.rule,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
  },
});
