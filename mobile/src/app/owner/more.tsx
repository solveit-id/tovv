import { MenuScreen } from '@/features/more/menu-screen';

export default function OwnerMore() {
  return (
    <MenuScreen
      groups={[
        {
          title: 'Operasional',
          items: [
            { icon: 'tow-truck', label: 'Armada & jadwal', hint: 'Unit, kapasitas, mitra, jadwal', href: '/fleet' },
            { icon: 'package-variant', label: 'Paket layanan', hint: 'Car Towing, Car Carrier, Storing Motor, Self Drive', href: '/services' },
            { icon: 'calculator-variant-outline', label: 'Hitung harga', hint: 'Cek untung-rugi sebelum memberi harga', href: '/pricing' },
            { icon: 'cash-check', label: 'Biaya & uang jalan', hint: 'Persetujuan biaya aktual', href: '/finance/expenses' },
          ],
        },
        {
          title: 'Pelanggan & bisnis',
          items: [
            { icon: 'domain', label: 'Pelanggan bisnis', hint: 'Tarif khusus, PO dan kontribusi per pelanggan', href: '/business' },
            { icon: 'file-check-outline', label: 'Antrean keuangan', hint: 'Bukti bayar dan tagihan yang belum lunas', href: '/finance/queue' },
            { icon: 'package-variant-closed', label: 'Paket langganan Tovv (DEMO)', hint: 'Langganan atau bayar per layanan', href: '/saas' },
            { icon: 'shield-account-outline', label: 'Akses dukungan Solveit', hint: 'Izin sementara untuk tim Solveit, dapat dicabut', href: '/support-access' },
          ],
        },
      ]}
    />
  );
}
