import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useColors } from '@/core/design/theme';
import { t } from '@/core/i18n';

/**
 * Wordmark SEMENTARA "tovv" — dibuat untuk prototype karena logo Tovv resmi belum tersedia.
 * Huruf dibangun di grid 2 px; "v" kedua memakai biru langit logo Solveit sebagai satu-satunya aksen.
 * Ganti komponen ini saat logo resmi diterima (lihat docs/DESIGN.md → Identitas).
 */
const T = 'M4 4h7v10h7v6.5h-7V36H4V20.5H0V14h4Z';
const O = 'M22 25a11 11 0 1 0 22 0a11 11 0 1 0-22 0ZM28.25 25a4.75 4.75 0 1 1 9.5 0a4.75 4.75 0 1 1-9.5 0Z';
const V1 = 'M47 14h7.5L59 27.5L63.5 14H71L62.6 36h-7.2Z';
const V2 = 'M73 14h7.5L85 27.5L89.5 14H97L88.6 36h-7.2Z';

export function Wordmark({ height = 28, onDark = true }: { height?: number; onDark?: boolean }) {
  const c = useColors();
  const ink = onDark ? c.onHero : c.ink;
  return (
    <Svg width={(height * 98) / 40} height={height} viewBox="0 0 98 40" accessibilityRole="image" accessibilityLabel={t('Tovv')}>
      <Path d={T} fill={ink} />
      <Path d={O} fill={ink} fillRule="evenodd" />
      <Path d={V1} fill={ink} />
      <Path d={V2} fill={onDark ? c.brandSky : c.accentInk} />
    </Svg>
  );
}

export const WORDMARK_PATHS = { T, O, V1, V2 };
