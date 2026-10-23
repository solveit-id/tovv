import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { palettes, type Palette, type Scheme } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeValue {
  scheme: Scheme;
  c: Palette;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const PREF_KEY = 'tovv.theme';

type KV = { getItemSync: (k: string) => string | null; setItemSync: (k: string, v: string) => void };
/** Dimuat malas: penyimpanan preferensi tidak boleh menggagalkan render (mis. di lingkungan uji). */
function kv(): KV | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('expo-sqlite/kv-store') as { default: KV }).default;
  } catch {
    return null;
  }
}

const ThemeContext = createContext<ThemeValue>({
  scheme: 'light',
  c: palettes.light,
  preference: 'system',
  setPreference: () => undefined,
});

function readSaved(): ThemePreference {
  try {
    const saved = kv()?.getItemSync(PREF_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function applyPreference(p: ThemePreference) {
  try {
    Appearance.setColorScheme(p === 'system' ? 'unspecified' : p);
  } catch {
    // Platform lama tanpa override: tetap mengikuti sistem.
  }
}

/**
 * Tema mengikuti sistem (terang/gelap) kecuali pengguna memilih lain di Lainnya → Tampilan.
 * Preferensi disimpan lokal di perangkat; bila penyimpanan gagal, aplikasi tetap mengikuti sistem.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(readSaved);

  useEffect(() => {
    if (preference !== 'system') applyPreference(preference);
    // Hanya saat mulai: preferensi tersimpan diterapkan ke Appearance sekali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    applyPreference(p);
    try {
      kv()?.setItemSync(PREF_KEY, p);
    } catch {
      // abaikan
    }
  }, []);

  const scheme: Scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ scheme, c: palettes[scheme], preference, setPreference }), [scheme, preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).c;

/**
 * Gaya yang bergantung palet: dibuat sekali per skema lalu di-cache, jadi berganti tema
 * tidak membuat ulang StyleSheet di setiap render.
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles<T>>(factory: (c: Palette, scheme: Scheme) => T) {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles(): T {
    const { scheme, c } = useTheme();
    return (cache[scheme] ??= StyleSheet.create(factory(c, scheme)));
  };
}
