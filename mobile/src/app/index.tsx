import { Redirect } from 'expo-router';
import { useSession } from '@/data/api/provider';

/** Pintu masuk: tanpa sesi demo → layar mulai; dengan sesi → beranda sesuai konteks tampilan. */
export default function Index() {
  const session = useSession();
  if (!session) return <Redirect href="/mulai" />;
  return <Redirect href={`/${session.view}`} />;
}
