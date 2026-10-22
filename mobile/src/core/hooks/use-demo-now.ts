import { useEffect, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { useApi } from '@/data/api/provider';

/** Jam bisnis demo; berdetak hanya saat layar fokus agar timer tidak berjalan di latar. */
export function useDemoNow(intervalMs = 30_000): string {
  const api = useApi();
  const focused = useIsFocused();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!focused) return;
    const t = setInterval(() => setTick((x) => x + 1), intervalMs);
    return () => clearInterval(t);
  }, [focused, intervalMs]);
  return api.now();
}
