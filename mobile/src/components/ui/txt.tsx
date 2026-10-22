import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { color, type ColorToken, type, type TypeVariant } from '@/core/design/tokens';

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  tone?: ColorToken;
  align?: TextStyle['textAlign'];
  tabular?: boolean;
  strike?: boolean;
}

/** Teks Tovv: varian dari skala tipe; ukuran mengikuti pengaturan sistem (tidak dikunci). */
export function Txt({ variant = 'body', tone = 'ink', align, tabular, strike, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[
        type[variant] as TextStyle,
        { color: color[tone] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        strike ? { textDecorationLine: 'line-through' } : null,
        style,
      ]}
    />
  );
}
