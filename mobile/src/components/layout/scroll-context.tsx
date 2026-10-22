import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** Posisi gulir layar dan tinggi header, dibagikan Screen ke RootHeader untuk efek parallax di UI thread. */
export interface ScrollState {
  y: SharedValue<number>;
  heroH: SharedValue<number>;
}

export const ScrollContext = createContext<ScrollState | null>(null);
export const useScrollState = () => useContext(ScrollContext);
