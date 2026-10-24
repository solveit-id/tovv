import { useCallback, useRef } from 'react';
import { useFocusEffect, useIsFocused } from 'expo-router';

/**
 * Interval muat ulang yang hanya berjalan selama layar terlihat. Dibaca dari ref yang diatur listener
 * fokus navigasi — listener itu tetap berjalan walau layar tab dibekukan (freezeOnBlur).
 * Pakai sebagai `refetchInterval` TanStack Query. Identitas fungsi berganti saat layar kembali fokus,
 * sehingga TanStack menghitung ulang intervalnya dan pemuatan berkala berjalan lagi.
 */
export function useFocusInterval(ms: number) {
  const isFocused = useIsFocused();
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, []),
  );
  return useCallback(() => (focused.current ? ms : false), [ms, isFocused]); // eslint-disable-line react-hooks/exhaustive-deps
}
