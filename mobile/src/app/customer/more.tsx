import { MenuScreen } from '@/features/more/menu-screen';

export default function CustomerMore() {
  return (
    <MenuScreen
      groups={[
        {
          title: 'Layanan',
          items: [
            { icon: 'plus-circle-outline', label: 'Pesan towing', hint: 'Operator mengecek dulu sebelum memberi harga', href: '/request/new' },
            { icon: 'tow-truck', label: 'Paket layanan', hint: 'Car Towing, Car Carrier, Storing Motor, Self Drive', href: '/services' },
            { icon: 'domain', label: 'Organisasi saya', hint: 'Untuk pelanggan bisnis: tarif khusus, PO, riwayat', href: '/business' },
          ],
        },
      ]}
    />
  );
}
