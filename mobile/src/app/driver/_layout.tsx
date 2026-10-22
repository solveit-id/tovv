import { RoleTabs } from '@/components/layout/role-tabs';
import { useTovvQuery } from '@/data/api/hooks';

export default function DriverLayout() {
  const outbox = useTovvQuery(['outbox'], (api) => api.listOutbox());
  const pending = outbox.data?.filter((x) => x.status === 'pending' || x.status === 'needs_review').length ?? 0;
  return (
    <RoleTabs
      view="driver"
      tabs={[
        { name: 'index', title: 'Tugas', icon: 'clipboard-check-outline' },
        { name: 'biaya', title: 'Biaya', icon: 'cash-multiple' },
        { name: 'sinkron', title: 'Sinkron', icon: 'cloud-sync-outline', badge: pending },
        { name: 'lainnya', title: 'Lainnya', icon: 'dots-horizontal-circle-outline' },
      ]}
    />
  );
}
