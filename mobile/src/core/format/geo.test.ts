import { bearing, formatKm, straightKm } from './geo';

describe('jarak dan arah garis lurus', () => {
  const surabaya = { lat: -7.2862, lng: 112.7389 };
  const sidoarjo = { lat: -7.4478, lng: 112.7183 };

  it('jarak Surabaya → Sidoarjo (fixture) sekitar 18 km garis lurus', () => {
    expect(straightKm(surabaya, sidoarjo)).toBeGreaterThan(17);
    expect(straightKm(surabaya, sidoarjo)).toBeLessThan(19);
  });

  it('arah ke selatan sekitar 180°, ke timur sekitar 90°', () => {
    expect(Math.round(bearing(surabaya, sidoarjo) / 10) * 10).toBe(190);
    expect(Math.round(bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }))).toBe(90);
  });

  it('format jarak memakai koma desimal di bahasa Indonesia', () => {
    expect(formatKm(1.44, 'id')).toBe('1,4 km');
    expect(formatKm(1.44, 'en')).toBe('1.4 km');
    expect(formatKm(0.853)).toBe('850 m');
    expect(formatKm(18.2)).toBe('18 km');
  });
});
