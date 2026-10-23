import { createContext, useContext, type RefObject } from 'react';
import type { ViewInstance } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Posisi gulir layar, tinggi header dan wadah isi, dibagikan Screen ke anak-anaknya:
 * RootHeader (parallax, hanya bila `hero`) dan useScrollReveal (kartu muncul saat masuk layar).
 */
export interface ScrollState {
  y: SharedValue<number>;
  heroH: SharedValue<number>;
  hero: boolean;
  contentRef: RefObject<ViewInstance | null>;
}

export const ScrollContext = createContext<ScrollState | null>(null);
export const useScrollState = () => useContext(ScrollContext);
