import { MenuScreen } from '@/features/more/menu-screen';

export default function OwnerMore() {
  return (
    <MenuScreen
      groups={[
        {
          title: 'Operasi',
          items: [
            { icon: 'tow-truck', label: 'Armada & jadwal', hint: 'Unit, kapasitas, mitra, reservasi', href: '/fleet' },
            { icon: 'account-key-outline', label: 'Delegasi', hint: 'Mandat terbatas saat Anda mengemudi', href: '/delegations' },
            { icon: 'calculator-variant-outline', label: 'Hitung harga', hint: 'Simulasi negosiasi F-01/F-02', href: '/pricing' },
            { icon: 'cash-check', label: 'Biaya & uang jalan', hint: 'Persetujuan biaya aktual', href: '/finance/expenses' },
          ],
        },
        {
          title: 'Pelanggan & bisnis',
          items: [
            { icon: 'domain', label: 'Pelanggan bisnis', hint: 'Rate card, PO, kontribusi per akun', href: '/business' },
            { icon: 'file-check-outline', label: 'Antrean finance', hint: 'Bukti bayar, invoice terbuka', href: '/finance/queue' },
            { icon: 'package-variant-closed', label: 'Paket SaaS (DEMO)', hint: 'Langganan vs per layanan', href: '/saas' },
            { icon: 'shield-account-outline', label: 'Akses dukungan Solveit', hint: 'Grant sementara, dapat dicabut', href: '/support-access' },
          ],
        },
      ]}
    />
  );
}
