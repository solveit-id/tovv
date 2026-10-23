/**
 * Gaya peta Google (Android) untuk tema gelap: jalan dan air diredam agar penanda tetap paling menonjol.
 * iOS memakai Apple Maps yang mengikuti `userInterfaceStyle`.
 */
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#141b26' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a97ab' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f17' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#253042' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2f3d55' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1524' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
];

/** Tema terang: sembunyikan tempat usaha dan transit agar tidak bersaing dengan penanda truk. */
export const LIGHT_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
