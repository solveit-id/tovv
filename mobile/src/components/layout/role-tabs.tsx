import React from 'react';
import { Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '@/core/design/tokens';
import { Icon } from '@/components/ui/icon';
import { useSession } from '@/data/api/provider';
import type { ViewGroup } from '@/domain/types';

export interface TabDef {
  name: string;
  title: string;
  icon: string;
  hidden?: boolean;
  badge?: number;
}

/** Tab bawah per kelompok tampilan. Konteks yang tidak cocok dialihkan, bukan dirender diam-diam. */
export function RoleTabs({ view, tabs }: { view: ViewGroup; tabs: TabDef[] }) {
  const session = useSession();
  const insets = useSafeAreaInsets();
  if (!session) return <Redirect href="/mulai" />;
  if (session.view !== view) return <Redirect href={`/${session.view}`} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.carbon,
        tabBarInactiveTintColor: color.inkSecondary,
        tabBarStyle: {
          backgroundColor: color.sheet,
          borderTopColor: color.rule,
          minHeight: 60 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: Platform.OS === 'android' ? 6 : 0 },
        tabBarAllowFontScaling: true,
        sceneStyle: { backgroundColor: color.ground },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            href: t.hidden ? null : undefined,
            tabBarBadge: t.badge ? t.badge : undefined,
            tabBarBadgeStyle: { backgroundColor: color.serial, fontSize: 11 },
            tabBarAccessibilityLabel: t.badge ? `${t.title}, ${t.badge} perlu perhatian` : t.title,
            tabBarIcon: ({ focused }) => <Icon name={focused ? t.icon.replace('-outline', '') : t.icon} size={24} tone={focused ? 'carbon' : 'inkSecondary'} />,
          }}
        />
      ))}
    </Tabs>
  );
}
