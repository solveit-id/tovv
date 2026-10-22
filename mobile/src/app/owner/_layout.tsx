import { RoleTabs } from '@/components/layout/role-tabs';

export default function OwnerLayout() {
  return (
    <RoleTabs
      view="owner"
      tabs={[
        { name: 'index', title: 'Beranda', icon: 'home-outline' },
        { name: 'pekerjaan', title: 'Pekerjaan', icon: 'clipboard-list-outline' },
        { name: 'keuangan', title: 'Keuangan', icon: 'chart-box-outline' },
        { name: 'lainnya', title: 'Lainnya', icon: 'dots-horizontal-circle-outline' },
      ]}
    />
  );
}
