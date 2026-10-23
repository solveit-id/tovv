import { RoleTabs } from '@/components/layout/role-tabs';

export default function CustomerLayout() {
  return (
    <RoleTabs
      view="customer"
      tabs={[
        { name: 'index', title: 'Beranda', icon: 'home-outline' },
        { name: 'orders', title: 'Pesanan', icon: 'tow-truck' },
        { name: 'map', title: 'Lacak', icon: 'map-marker-radius-outline' },
        { name: 'invoices', title: 'Tagihan', icon: 'file-document-outline' },
        { name: 'more', title: 'Lainnya', icon: 'dots-horizontal-circle-outline' },
      ]}
    />
  );
}
