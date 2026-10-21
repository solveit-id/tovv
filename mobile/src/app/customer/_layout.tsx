import { RoleTabs } from '@/components/layout/role-tabs';

export default function CustomerLayout() {
  return (
    <RoleTabs
      view="customer"
      tabs={[
        { name: 'index', title: 'Beranda', icon: 'home-outline' },
        { name: 'pesanan', title: 'Pesanan', icon: 'tow-truck' },
        { name: 'tagihan', title: 'Tagihan', icon: 'file-document-outline' },
        { name: 'lainnya', title: 'Lainnya', icon: 'dots-horizontal-circle-outline' },
      ]}
    />
  );
}
