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
