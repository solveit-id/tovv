import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { type ColorToken, type, type TypeVariant } from '@/core/design/tokens';
import { useColors } from '@/core/design/theme';
import { familyFor, fontState } from '@/core/design/fonts';
import { tr, useLocale } from '@/core/i18n';

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  tone?: ColorToken;
  align?: TextStyle['textAlign'];
  tabular?: boolean;
  strike?: boolean;
  bold?: boolean;
}

/**
 * Berat huruf → keluarga Plus Jakarta Sans. `fontWeight` di gaya tetap boleh dipakai pemanggil;
 * di sini diganti nama keluarga yang sesuai supaya Android tidak menebalkan huruf kustom dua kali.
 */
export function fontStyle(weight: TextStyle['fontWeight'] | undefined, family?: string): TextStyle | null {
  if (!fontState.ready || (family && !family.startsWith('PlusJakartaSans'))) return null;
  return { fontFamily: familyFor(weight), fontWeight: 'normal' };
}

/**
 * Teks Tovv: varian dari skala tipe, warna dari palet aktif; ukuran mengikuti pengaturan sistem.
 * Anak berupa teks diterjemahkan otomatis ke bahasa aktif bila ada di kamus (lihat core/i18n).
 */
export function Txt({ variant = 'body', tone = 'ink', align, tabular, strike, bold, style, children, ...rest }: TxtProps) {
  const c = useColors();
  useLocale();
  const content = typeof children === 'string' ? tr(children) : Array.isArray(children) ? React.Children.map(children, (ch) => (typeof ch === 'string' ? tr(ch) : ch)) : children;
  const base = type[variant] as TextStyle;
  const custom = style ? (StyleSheet.flatten(style) as TextStyle | undefined) : undefined;
  const weight = custom?.fontWeight ?? (bold ? '700' : base.fontWeight);
  return (
    <Text
      // Teks panjang dipecah merata antarbaris (Android) dan memakai aturan pemenggalan standar (iOS),
      // sehingga paragraf dan judul dua baris tidak menyisakan satu kata menggantung.
      textBreakStrategy="balanced"
      lineBreakStrategyIOS="standard"
      {...rest}
      style={[
        base,
        { color: c[tone] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        strike ? { textDecorationLine: 'line-through' } : null,
        bold ? { fontWeight: '700' } : null,
        style,
        fontStyle(weight, custom?.fontFamily ?? base.fontFamily),
      ]}
    >
      {content}
    </Text>
  );
}
