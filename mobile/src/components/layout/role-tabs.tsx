import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { glideSpring, useReducedMotion } from '@/core/design/motion';
import { Icon } from '@/components/ui/icon';
import { useSession } from '@/data/api/provider';
import type { ViewGroup } from '@/domain/types';
import { t, tr } from '@/core/i18n';

export interface TabDef {
  name: string;
  title: string;
  icon: string;
  hidden?: boolean;
  badge?: number;
}

/** Ikon tab dengan pil indikator aktif yang mekar (gaya navigation bar Material 3 / super-app). */
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? (focused ? 1 : 0) : withSpring(focused ? 1 : 0, glideSpring);
  }, [focused, reduced, p]);
  const pill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: 0.5 + p.value * 0.5 }] }));
  return (
    <View style={s.iconWrap}>
      <Animated.View style={[s.pill, pill]} />
      <Icon name={focused ? icon.replace('-outline', '') : icon} size={22} tone={focused ? 'accentInk' : 'inkSecondary'} />
    </View>
  );
}

/** Tab bawah per kelompok tampilan. Konteks yang tidak cocok dialihkan, bukan dirender diam-diam. */
export function RoleTabs({ view, tabs }: { view: ViewGroup; tabs: TabDef[] }) {
  const session = useSession();
  const insets = useSafeAreaInsets();
  const c = useColors();
  if (!session) return <Redirect href="/auth/login" />;
  if (session.view !== view) return <Redirect href={`/${session.view}`} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accentInk,
        tabBarInactiveTintColor: c.inkSecondary,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.line,
          minHeight: 64 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2, marginBottom: Platform.OS === 'android' ? 6 : 0 },
        tabBarAllowFontScaling: true,
        sceneStyle: { backgroundColor: c.bg },
        animation: 'shift',
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tr(tab.title),
            href: tab.hidden ? null : undefined,
            tabBarBadge: tab.badge ? tab.badge : undefined,
            tabBarBadgeStyle: { backgroundColor: c.badge, fontSize: 11 },
            tabBarAccessibilityLabel: tab.badge ? t('{0}, {1} perlu perhatian', [tab.title, tab.badge]) : tab.title,
            tabBarIcon: ({ focused }) => <TabIcon icon={tab.icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const useStyles = makeStyles((c) => ({
  iconWrap: { width: 60, height: 30, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: radius.pill, backgroundColor: c.accentSoft },
}));
