import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { color, radius, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';

/**
 * QR INTERNAL Tovv (PAY-10): hanya memuat tautan `tovv-demo://payment-request/<id>` yang membuka detail
 * setelah login. Bukan QRIS, tidak memuat payload pembayaran, dan tidak dapat memindahkan dana.
 */
export function InternalQr({ uri, size = 168 }: { uri: string; size?: number }) {
  const modules = useMemo(() => QRCode.create(uri, { errorCorrectionLevel: 'M' }).modules, [uri]);
  const n = modules.size;
  const cell = size / (n + 8);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.data[y * n + x]) rects.push(<Rect key={`${x}-${y}`} x={(x + 4) * cell} y={(y + 4) * cell} width={cell + 0.2} height={cell + 0.2} fill={color.navy} />);
    }
  }
  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={`QR internal Tovv menuju ${uri}. Bukan QRIS dan tidak dapat dibayar.`}>
      <View style={styles.band}>
        <Txt variant="caption" tone="onNavy" style={{ fontWeight: '700' }} maxFontSizeMultiplier={1.3}>QR INTERNAL TOVV · BUKAN QRIS</Txt>
      </View>
      <Svg width={size} height={size}>
        <Rect x={0} y={0} width={size} height={size} fill={color.sheet} />
        {rects}
      </Svg>
      <Txt variant="caption" tone="dangerInk" style={{ fontWeight: '700' }} align="center" maxFontSizeMultiplier={1.3}>TIDAK DAPAT DIBAYAR · DEMO</Txt>
      <Txt variant="mono" tone="inkSecondary" align="center" numberOfLines={2}>{uri}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.xs, padding: space.md, borderWidth: 1.5, borderColor: color.ruleStrong, borderStyle: 'dashed', borderRadius: radius.sheet, backgroundColor: color.sheet },
  band: { backgroundColor: color.navy, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 3 },
});
