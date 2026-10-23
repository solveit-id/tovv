import { MenuScreen } from '@/features/more/menu-screen';

export default function DriverMore() {
  return <MenuScreen groups={[{ title: 'Tugas', items: [{ icon: 'clipboard-check-outline', label: 'Tugas & riwayat', hint: 'Hanya tugas milik Anda', href: '/driver' }] }]} />;
}
