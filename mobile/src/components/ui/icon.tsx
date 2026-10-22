import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, type ColorToken } from '@/core/design/tokens';
import { useColors } from '@/core/design/theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Satu keluarga ikon (Material Community Icons). Dekoratif kecuali diberi label oleh pemanggil. */
export function Icon({ name, size = 20, tone = 'ink' }: { name: string; size?: number; tone?: ColorToken }) {
  const c = useColors();
  return (
    <MaterialCommunityIcons
      name={name as IconName}
      size={size}
      color={c[tone]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

/** Tile ikon membulat (pintasan, baris daftar): ikon di atas wash warnanya sendiri. */
export function IconTile({ name, size = 44, tone = 'accentInk', wash = 'accentSoft', shape = 'rounded' }: { name: string; size?: number; tone?: ColorToken; wash?: ColorToken; shape?: 'rounded' | 'circle' }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? size / 2 : size >= 48 ? radius.lg : radius.md,
        backgroundColor: c[wash],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={Math.round(size * 0.5)} tone={tone} />
    </View>
  );
}
