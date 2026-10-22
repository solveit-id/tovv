import { RoleTabs } from '@/components/layout/role-tabs';
import { useTovvQuery } from '@/data/api/hooks';

/** Admin: dispatcher dan finance dibedakan; tab yang tidak berizin tidak tampil. */
export default function AdminLayout() {
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const scopes = new Set(session.data?.scopes ?? []);
  const dispatcher = scopes.has('request.manage');
  const finance = scopes.has('payment.verify') || scopes.has('invoice.issue');
  return (
    <RoleTabs
      view="admin"
      tabs={[
        { name: 'index', title: 'Beranda', icon: 'home-outline' },
        { name: 'permintaan', title: 'Permintaan', icon: 'phone-incoming-outline', hidden: !dispatcher },
        { name: 'jadwal', title: 'Jadwal', icon: 'calendar-clock-outline', hidden: !dispatcher },
        { name: 'keuangan', title: 'Keuangan', icon: 'cash-check', hidden: !finance },
        { name: 'lainnya', title: 'Lainnya', icon: 'dots-horizontal-circle-outline' },
      ]}
    />
  );
}
