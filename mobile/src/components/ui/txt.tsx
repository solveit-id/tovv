import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { type ColorToken, type, type TypeVariant } from '@/core/design/tokens';
import { useColors } from '@/core/design/theme';

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  tone?: ColorToken;
  align?: TextStyle['textAlign'];
  tabular?: boolean;
  strike?: boolean;
  bold?: boolean;
}

/** Teks Tovv: varian dari skala tipe, warna dari palet aktif; ukuran mengikuti pengaturan sistem. */
export function Txt({ variant = 'body', tone = 'ink', align, tabular, strike, bold, style, ...rest }: TxtProps) {
  const c = useColors();
  return (
    <Text
      {...rest}
      style={[
        type[variant] as TextStyle,
        { color: c[tone] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        strike ? { textDecorationLine: 'line-through' } : null,
        bold ? { fontWeight: '700' } : null,
        style,
      ]}
    />
  );
}
