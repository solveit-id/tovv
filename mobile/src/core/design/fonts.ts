import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';

/**
 * Plus Jakarta Sans (OFL, buatan Indonesia) untuk seluruh antarmuka. Lima berat saja yang dimuat
 * (400–800) supaya bundel tetap kecil. Setiap berat adalah keluarga terpisah: di Android, berat huruf
 * kustom dipilih lewat nama keluarga, bukan `fontWeight`, agar tidak ditebalkan dua kali.
 */
export const FONT_ASSETS = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

const FAMILY: Record<string, keyof typeof FONT_ASSETS> = {
  '100': 'PlusJakartaSans_400Regular',
  '200': 'PlusJakartaSans_400Regular',
  '300': 'PlusJakartaSans_400Regular',
  '400': 'PlusJakartaSans_400Regular',
  normal: 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  bold: 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
  '900': 'PlusJakartaSans_800ExtraBold',
};

/** Nama keluarga Plus Jakarta Sans untuk berat huruf tertentu. */
export function familyFor(weight: string | number | undefined): string {
  return FAMILY[String(weight ?? '400')] ?? 'PlusJakartaSans_400Regular';
}

/** Diisi saat aplikasi dibuka: bila font gagal dimuat, teks jatuh ke font sistem dengan berat biasa. */
export const fontState = { ready: false };

export function setFontsReady(ready: boolean) {
  fontState.ready = ready;
}
