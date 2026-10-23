import { Redirect } from 'expo-router';
import { useSession } from '@/data/api/provider';

/** Pintu masuk: tanpa sesi → halaman masuk; dengan sesi → beranda sesuai peran. */
export default function Index() {
  const session = useSession();
  if (!session) return <Redirect href="/auth/login" />;
  return <Redirect href={`/${session.view}`} />;
}
