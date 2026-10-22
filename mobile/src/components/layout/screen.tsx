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
  headerScrolls = false,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onRefresh?: () => Promise<unknown>;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Header akar ikut tergulir agar daftar mendapat ruang baca; pita DEMO tetap terpaku di atas. */
  headerScrolls?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[{ paddingBottom: footer ? space.xxl : space.huge + insets.bottom }]}
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
      {headerScrolls ? header : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {headerScrolls && scroll ? null : header}
      {body}
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}><View style={styles.footerInner}>{footer}</View></View> : null}
    </KeyboardAvoidingView>
  );
}

const MAX_CONTENT = 720;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  flex: { flex: 1 },
  // Lebar baca dibatasi di tablet/lanskap; header tetap selebar layar.
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
  footer: {
    backgroundColor: color.sheet,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.rule,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  footerInner: { gap: space.sm, width: '100%', maxWidth: MAX_CONTENT - space.lg * 2, alignSelf: 'center' },
});
