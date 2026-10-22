import { MenuScreen } from '@/features/more/menu-screen';

export default function OwnerMore() {
  return (
    <MenuScreen
      groups={[
        {
          title: 'Operasi',
          items: [
            { icon: 'tow-truck', label: 'Armada & jadwal', hint: 'Unit, kapasitas, mitra, reservasi', href: '/fleet' },
            { icon: 'account-key-outline', label: 'Delegasi', hint: 'Beri admin wewenang harga saat Anda mengemudi', href: '/delegations' },
            { icon: 'calculator-variant-outline', label: 'Hitung harga', hint: 'Cek untung-rugi sebelum memberi harga', href: '/pricing' },
            { icon: 'cash-check', label: 'Biaya & uang jalan', hint: 'Persetujuan biaya aktual', href: '/finance/expenses' },
          ],
        },
        {
          title: 'Pelanggan & bisnis',
          items: [
            { icon: 'domain', label: 'Pelanggan bisnis', hint: 'Tarif khusus, PO dan kontribusi per pelanggan', href: '/business' },
            { icon: 'file-check-outline', label: 'Antrean finance', hint: 'Bukti bayar, invoice terbuka', href: '/finance/queue' },
            { icon: 'package-variant-closed', label: 'Paket langganan Tovv (DEMO)', hint: 'Langganan vs per layanan', href: '/saas' },
            { icon: 'shield-account-outline', label: 'Akses dukungan Solveit', hint: 'Izin sementara untuk tim Solveit, dapat dicabut', href: '/support-access' },
          ],
        },
      ]}
    />
  );
}
