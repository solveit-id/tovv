import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { color, type ColorToken } from '@/core/design/tokens';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Satu keluarga ikon (Material Community Icons, garis). Dekoratif kecuali diberi label oleh pemanggil. */
export function Icon({ name, size = 20, tone = 'ink' }: { name: string; size?: number; tone?: ColorToken }) {
  return (
    <MaterialCommunityIcons
      name={name as IconName}
      size={size}
      color={color[tone]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
