import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, touch } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Wordmark } from '@/components/brand/wordmark';

export function HeaderIconButton({ icon, label, onPress, badge, onDark = true }: { icon: string; label: string; onPress: () => void; badge?: number; onDark?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} belum dibaca` : label}
      hitSlop={6}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: onDark ? color.navyRaised : color.carbonTint }]}
    >
      <Icon name={icon} size={22} tone={onDark ? 'onNavy' : 'ink'} />
      {badge ? (
        <View style={styles.badge}>
          <Txt variant="caption" tone="onNavy" style={{ fontSize: 10, lineHeight: 12, fontWeight: '700' }} maxFontSizeMultiplier={1.2}>
            {badge > 9 ? '9+' : String(badge)}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Header akar tab: pita navy dengan wordmark, konteks, dan tindakan header. */
export function RootHeader({ title, subtitle, right, children }: { title?: string; subtitle?: string; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.rootRow}>
        <View style={{ flex: 1, gap: 2 }}>
          {title ? (
            <Txt variant="title" tone="onNavy" accessibilityRole="header" numberOfLines={2}>{title}</Txt>
          ) : (
            <View accessibilityRole="header">
              <Wordmark height={26} />
            </View>
          )}
          {subtitle ? <Txt variant="bodySm" tone="onNavySecondary" numberOfLines={2}>{subtitle}</Txt> : null}
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
      {children}
    </View>
  );
}

/** Header layar detail: putih, tombol kembali di kiri, judul dan konteks. Gesture back OS tetap aktif. */
export function DetailHeader({ title, subtitle, right, serial }: { title: string; subtitle?: string; right?: React.ReactNode; serial?: string }) {
  const router = useRouter();
  return (
    <View style={styles.detail}>
      <HeaderIconButton icon="arrow-left" label="Kembali" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} onDark={false} />
      <View style={{ flex: 1 }}>
        {serial ? <Txt variant="serial" tone="serial">{serial}</Txt> : null}
        <Txt variant="titleSm" accessibilityRole="header" numberOfLines={2}>{title}</Txt>
        {subtitle ? <Txt variant="caption" tone="inkSecondary" numberOfLines={2}>{subtitle}</Txt> : null}
      </View>
      <View style={styles.actions}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: color.navy, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg, gap: space.md },
  rootRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  iconBtn: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 8, right: 8, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: color.serial, alignItems: 'center', justifyContent: 'center' },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingRight: space.md,
    paddingLeft: space.xs,
    paddingVertical: space.xs,
    backgroundColor: color.sheet,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: color.rule,
    minHeight: 60,
  },
});
