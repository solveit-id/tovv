import { MenuScreen } from '@/features/more/menu-screen';

export default function AdminMore() {
  return (
    <MenuScreen
      groups={[
        {
          title: 'Kerja',
          items: [
            { icon: 'domain', label: 'Pelanggan bisnis', hint: 'Rate card, mandat, PO', href: '/business' },
            { icon: 'cash-check', label: 'Biaya & uang jalan', hint: 'Biaya aktual per pekerjaan', href: '/finance/expenses' },
            { icon: 'chart-box-outline', label: 'Laporan', hint: 'Hanya untuk finance', href: '/reports' },
            { icon: 'calculator-variant-outline', label: 'Hitung harga', hint: 'Simulasi; pengiriman sesuai delegasi', href: '/pricing' },
          ],
        },
      ]}
    />
  );
}
