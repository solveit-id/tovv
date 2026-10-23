import { RoleTabs } from '@/components/layout/role-tabs';

export default function OwnerLayout() {
  return (
    <RoleTabs
      view="owner"
      tabs={[
        { name: 'index', title: 'Beranda', icon: 'home-outline' },
        { name: 'jobs', title: 'Pekerjaan', icon: 'clipboard-list-outline' },
        { name: 'map', title: 'Peta', icon: 'map-outline' },
        { name: 'finance', title: 'Keuangan', icon: 'chart-box-outline' },
        { name: 'more', title: 'Lainnya', icon: 'dots-horizontal-circle-outline' },
      ]}
    />
  );
}
