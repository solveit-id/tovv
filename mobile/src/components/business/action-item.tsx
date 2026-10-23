import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { radius, space, cardChrome, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { useEnter } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon, IconTile } from '@/components/ui/icon';
import { Money } from '@/components/ui/surface';
import { PressableScale } from '@/components/ui/pressable-scale';
import type { DailyAction } from '@/data/api/contract';
import { formatShortDateTime } from '@/core/format/time';
import { t } from '@/core/i18n';

const SEVERITY: Record<DailyAction['severity'], { icon: string; label: string; ink: ColorToken; wash: ColorToken }> = {
  blocker: { icon: 'alert-octagon-outline', label: 'Mendesak', ink: 'dangerInk', wash: 'dangerWash' },
  attention: { icon: 'alert-circle-outline', label: 'Perlu perhatian', ink: 'warnInk', wash: 'warnWash' },
  info: { icon: 'information-outline', label: 'Untuk diketahui', ink: 'accentInk', wash: 'accentSoft' },
};

/**
 * Kartu tindakan harian: tingkat (ikon + teks), judul, nominal, alasan, penanggung jawab dan tenggat,
 * lalu tautan ke sumbernya. Tidak ada tombol "selesai" — item hilang saat sumbernya beres.
 */
export function ActionItem({ item, index = 0 }: { item: DailyAction; index?: number; last?: boolean }) {
  const router = useRouter();
  const s = useStyles();
  const c = useColors();
  const entering = useEnter(index);
  const sev = SEVERITY[item.severity];
  return (
    <Animated.View entering={entering}>
      <PressableScale
        onPress={() => router.push(item.link as Href)}
        accessibilityRole="button"
        accessibilityLabel={t('{0}: {1}. {2}. Penanggung jawab {3}.', [sev.label, item.title, item.reason, item.picName])}
        accessibilityHint={t('Buka untuk menyelesaikan')}
        style={s.card}
      >
        <IconTile name={sev.icon} size={40} tone={sev.ink} wash={sev.wash} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="bodyStrong" numberOfLines={3}>{item.title}</Txt>
          <Txt variant="bodySm" tone="inkSecondary" numberOfLines={3}>{item.reason}</Txt>
          <View style={s.top}>
            <View style={[s.chip, { backgroundColor: c[sev.wash] }]}>
              <Txt variant="caption" tone={sev.ink} bold maxFontSizeMultiplier={1.3}>{sev.label}</Txt>
            </View>
            {item.dueAt ? <Txt variant="caption" tone="inkSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>{t('Batas {0}', [formatShortDateTime(item.dueAt)])}</Txt> : null}
          </View>
          <View style={s.foot}>
            <View style={s.pic}>
              <Icon name="account-circle-outline" size={15} tone="inkSecondary" />
              <Txt variant="caption" tone="inkSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>{item.picName}</Txt>
            </View>
            {item.amount ? <Money value={item.amount} size="sm" /> : null}
          </View>
        </View>
        <Icon name="chevron-right" size={20} tone="inkMuted" />
      </PressableScale>
    </Animated.View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  card: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.md + 2,
    borderRadius: radius.lg,
    backgroundColor: c.surface,
    marginBottom: space.sm + 2,
    ...cardChrome(c, scheme),
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap', marginTop: 2 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, marginTop: 2 },
  pic: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
}));
