import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import * as status from '@/core/i18n/status';

const glyphs: Record<string, number> = JSON.parse(
  readFileSync(join(__dirname, '../../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'), 'utf8'),
);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.endsWith('.test.ts') ? [p] : [];
  });
}

describe('ikon satu keluarga (Material Community Icons)', () => {
  it('semua ikon status ada', () => {
    const names = (Object.values(status) as unknown[])
      .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v))
      .flatMap((m) => Object.values(m))
      .filter((x): x is { icon: string } => typeof x === 'object' && x !== null && 'icon' in x)
      .map((x) => x.icon);
    const missing = names.filter((n) => !(n in glyphs));
    expect(missing).toEqual([]);
  });

  it('semua literal ikon di kode sumber ada (termasuk varian aktif tab tanpa -outline)', () => {
    const src = walk(join(__dirname, '../..'));
    const found = new Set<string>();
    const re = /\b(?:icon|name)[=:]\s*["']([a-z0-9-]+)["']/g;
    src.forEach((f) => {
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(re)) found.add(m[1]!);
      for (const m of text.matchAll(/icon: '([a-z0-9-]+)'/g)) found.add(m[1]!);
    });
    const candidates = [...found].filter((n) => n.includes('-') || n in glyphs);
    const tabActive = [...found].filter((n) => n.endsWith('-outline')).map((n) => n.replace('-outline', ''));
    const notIcons = new Set(['demo', 'camera', 'index']);
    const missing = [...candidates, ...tabActive.filter((n) => found.has(`${n}-outline`) && /home|clipboard|chart-box|dots-horizontal-circle|phone-incoming|calendar-clock|cloud-sync|file-document/.test(n))]
      .filter((n) => !notIcons.has(n) && !(n in glyphs) && !/^(index|pekerjaan|keuangan|lainnya|permintaan|jadwal|biaya|sinkron|pesanan|tagihan)$/.test(n));
    expect([...new Set(missing)]).toEqual([]);
  });
});
