import { MenuScreen } from '@/features/more/menu-screen';

export default function CustomerMore() {
  return (
    <MenuScreen
      groups={[
        {
          title: 'Layanan',
          items: [
            { icon: 'plus-circle-outline', label: 'Minta derek', hint: 'Operator meninjau sebelum memberi harga', href: '/request/new' },
            { icon: 'domain', label: 'Organisasi saya', hint: 'Untuk pelanggan bisnis: rate card, PO, histori', href: '/business' },
          ],
        },
      ]}
    />
  );
}
