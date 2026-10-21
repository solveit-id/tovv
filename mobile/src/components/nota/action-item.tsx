import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { color, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Money } from '@/components/ui/nota';
import type { DailyAction } from '@/data/api/contract';
import { formatShortDateTime } from '@/core/format/time';

const SEVERITY = {
  blocker: { icon: 'alert-octagon-outline', label: 'Menghambat', tone: 'dangerInk' as const },
  attention: { icon: 'alert-circle-outline', label: 'Perlu perhatian', tone: 'warnInk' as const },
  info: { icon: 'information-outline', label: 'Info', tone: 'carbon' as const },
};

/** Satu baris tindakan harian: alasan, PIC, tenggat dan tautan ke sumbernya. Tidak ada tombol "selesai". */
export function ActionItem({ item, last }: { item: DailyAction; last?: boolean }) {
  const router = useRouter();
  const s = SEVERITY[item.severity];
  return (
    <Pressable
      onPress={() => router.push(item.link as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${s.label}: ${item.title}. ${item.reason}. PIC ${item.picName}.`}
      accessibilityHint="Buka sumber tindakan"
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { backgroundColor: color.carbonTint }]}
    >
      <View style={styles.sev}>
        <Icon name={s.icon} size={20} tone={s.tone} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={3}>{item.title}</Txt>
        {item.amount ? <Money value={item.amount} size="sm" align="left" /> : null}
        <Txt variant="bodySm" tone="inkSecondary" numberOfLines={3}>{item.reason}</Txt>
        <Txt variant="caption" tone="inkSecondary">
          <Txt variant="caption" tone={s.tone} style={{ fontWeight: '700' }}>{s.label}</Txt>
          {` · PIC ${item.picName}${item.dueAt ? ` · tenggat ${formatShortDateTime(item.dueAt)}` : ''}`}
        </Txt>
      </View>
      <View style={styles.right}>
        <Icon name="chevron-right" size={20} tone="inkSecondary" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg, minHeight: 64 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  sev: { paddingTop: 14 },
  right: { justifyContent: 'center' },
});
