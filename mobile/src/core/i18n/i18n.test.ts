import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { EN } from './en';
import { getLocale, setLocale, t, tr } from './index';

describe('dua bahasa', () => {
  afterEach(() => setLocale('id'));

  it('uji memakai bahasa Indonesia sebagai sumber', () => {
    expect(getLocale()).toBe('id');
    expect(t('Halo, {0}', ['Raka'])).toBe('Halo, Raka');
  });

  it('bahasa Inggris memakai kamus dan mengisi placeholder', () => {
    setLocale('en');
    expect(t('Halo, {0}', ['Raka'])).toBe('Hi, Raka');
    expect(tr('Keluar')).toBe('Sign out');
    expect(tr('Teks yang belum diterjemahkan')).toBe('Teks yang belum diterjemahkan');
  });

  it.each(Object.entries(EN))('placeholder "%s" sama di terjemahan', (id, en) => {
    const ph = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join();
    expect(ph(en)).toBe(ph(id));
    expect(en.trim().length).toBeGreaterThan(0);
  });
});

/** Teks yang sama di kedua bahasa (format, nama, kode) tidak perlu entri. */
const SAME_IN_BOTH = /^[{}\d\s·→–—:,.()%±+-]*$|^(Tovv|Offline|Status: \{0\}\{1\}|Status \{0\}\{1\}|Invoice \{0\}|Unit \{0\} · \{1\}|\{0\} · .*)$/;
const LITERAL = /\bt\(\s*'((?:[^'\\]|\\.)*)'/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.includes('.test.') ? [p] : [];
  });
}

describe('setiap teks t() di layar dan komponen punya terjemahan Inggris', () => {
  const root = join(__dirname, '../..');
  const missing: string[] = [];
  [...walk(join(root, 'features')), ...walk(join(root, 'components'))].forEach((f) => {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(LITERAL)) {
      const id = m[1]!.split("\\'").join("'").split('\\n').join('\n');
      if (!(id in EN) && !SAME_IN_BOTH.test(id)) missing.push(`${f.slice(root.length)}: ${id}`);
    }
  });
  it('tidak ada yang terlewat', () => {
    expect(missing).toEqual([]);
  });
});
