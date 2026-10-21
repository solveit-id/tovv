import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { SectionTitle, Sheet } from '@/components/ui/nota';
import { ErrorBlock, LoadingBlock } from '@/components/ui/states';
import { StageLine } from '@/components/nota/stage-line';
import { useToast } from '@/components/feedback/toast';
import { useTovvQuery } from '@/data/api/hooks';
import { useApi, useSession } from '@/data/api/provider';
import type { OrderAction, OrderDetail } from '@/data/api/contract';
import { executionStatus, expenseStatus } from '@/core/i18n/status';
import { formatRupiah } from '@/core/format/money';
import { QuoteStack } from '@/features/quotes/quote-doc-view';
import { useDemoNow } from '@/core/hooks/use-demo-now';
import {
  AssignmentHistory,
  ChangeOrdersHistory,
  ContactsSection,
  EvidenceSection,
  HandoverSummary,
  InstructionsSection,
  InternalCostSection,
  InvoicesSection,
  OrderAlerts,
  TripDocument,
} from './order-sections';
import { OrderSheets, type SheetKind, type SheetSubmit } from './order-sheets';

type TripAction = 'start_pickup' | 'arrive_pickup' | 'start_loading' | 'start_transit' | 'arrive_delivery';

/** Detail pekerjaan untuk semua peran. Isi dan tindakan mengikuti DTO dan allowedActions dari sumber data. */
export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const session = useSession();
  const toast = useToast();
  const qc = useQueryClient();
  const now = useDemoNow();
  const q = useTovvQuery(['order', id], (a) => a.getOrder(id));
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [busy, setBusy] = useState<OrderAction | null>(null);

  const d = q.data;
  const view = session?.view;
  const isStaff = view === 'owner' || view === 'admin';
  const isDriver = view === 'driver';

  const act = async (a: OrderAction, fn: () => Promise<unknown>, ok: string) => {
    setBusy(a);
    try {
      await fn();
      toast.show(ok, 'ok');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : String(e), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const submit: SheetSubmit = {
    reject: (r) => api.respondAssignment(id, false, r).then(() => toast.show('Penolakan terkirim. Admin akan mencari pengganti.', 'ok')),
    incident: (t, n) => api.reportIncident(id, t, n).then(() => toast.show('Kendala tercatat dan diteruskan ke admin.', 'ok')),
    exception: (r) => api.advanceTrip(id, 'start_loading', r).then(() => toast.show('Mulai memuat. Pengecualian foto tercatat.', 'ok')),
    cancel: (r) => api.cancelOrder(id, r).then(() => toast.show('Order dibatalkan; reservasi unit dilepas.', 'ok')),
    abort: (info) => api.abortOrder(id, info).then(() => toast.show('Penghentian tercatat dengan penguasaan kendaraan dan PIC.', 'ok')),
    change: (amt, r) => api.proposeChange(id, amt, r).then(() => toast.show('Biaya tambahan diajukan; belum ditagih.', 'ok')),
    decide: (cid, ap, note) => api.decideChange(cid, ap, note).then(() => toast.show(ap ? 'Biaya tambahan disetujui.' : 'Biaya tambahan ditolak; tagihan tidak berubah.', 'ok')),
    resolve: (iid, f) => api.resolveIncident(iid, f).then(() => toast.show('Kendala ditutup. Tahap perjalanan tidak berubah otomatis.', 'ok')),
    expense: (c, amt, n) => api.addExpense(id, c, amt, n).then(() => toast.show('Biaya tercatat; menunggu persetujuan finance.', 'ok')),
  };

  const tripLabel = (a: TripAction) => d?.nextAction?.label ?? a;
  const runTrip = (a: TripAction) => {
    if (a === 'start_loading' && d?.blockedReason) {
      setSheet({ kind: 'exception' });
      return;
    }
    void act(a, () => api.advanceTrip(id, a, null), `${tripLabel(a)} — tercatat.`);
  };

  let footer: React.ReactNode = null;
  if (d) footer = <Footer d={d} isDriver={isDriver} isStaff={isStaff} busy={busy} runTrip={runTrip} setSheet={setSheet} act={act} />;

  return (
    <Screen
      onRefresh={() => qc.invalidateQueries()}
      header={
        <DetailHeader
          serial={d ? `O-${d.summary.alias}` : undefined}
          title={d ? d.summary.customerLabel : 'Detail pekerjaan'}
          subtitle={d ? executionStatus[d.summary.status].label : undefined}
        />
      }
      footer={footer}
    >
      {q.isPending ? <LoadingBlock /> : q.isError ? <ErrorBlock error={q.error} onRetry={() => void q.refetch()} /> : d ? (
        <>
          <TripDocument d={d} />
          <OrderAlerts
            d={d}
            onResolve={d.allowedActions.includes('resolve_incident') ? (iid) => setSheet({ kind: 'resolve', incidentId: iid }) : undefined}
            onDecideChange={d.allowedActions.includes('approve_change') || (isStaff && d.changeOrders.some((c) => c.status === 'pending')) ? (cid) => setSheet({ kind: 'decide', changeId: cid }) : undefined}
          />
          {d.blockedReason && isDriver ? (
            <Txt variant="bodySm" tone="warnInk" style={{ marginTop: space.md, fontWeight: '600' }}>{d.blockedReason}</Txt>
          ) : null}

          <SectionTitle title="Tahap perjalanan" action={d.allowedActions.includes('view_tracking') ? <Button label="Lihat lokasi" variant="quiet" compact icon="map-marker-path" onPress={() => router.push(`/order/${id}/tracking`)} /> : null} />
          <Sheet>
            <StageLine entries={d.timeline} />
          </Sheet>

          <EvidenceSection d={d} canCapture={d.allowedActions.includes('capture_evidence') || isStaff} />
          {isDriver || isStaff ? <ContactsSection d={d} /> : null}
          {isDriver ? <InstructionsSection d={d} /> : null}
          <HandoverSummary d={d} />

          {d.quote && !isDriver ? (
            <View>
              <SectionTitle title="Penawaran disetujui" />
              <QuoteStack quotes={[d.quote]} now={now} />
            </View>
          ) : null}
          <ChangeOrdersHistory d={d} />
          <InvoicesSection d={d} />
          {isDriver && d.expenses.length ? (
            <View>
              <SectionTitle title="Biaya yang saya ajukan" count={d.expenses.length} />
              <Sheet>
                {d.expenses.map((e) => (
                  <Txt key={e.id} variant="bodySm">{`${e.category} · ${formatRupiah(e.amount)} · ${e.source === 'local_pending' ? 'menunggu sinkron' : expenseStatus[e.status].label}`}</Txt>
                ))}
              </Sheet>
            </View>
          ) : null}
          <InternalCostSection d={d} onFinalize={isStaff ? () => void act('close', () => api.finalizeCosts(id), 'Biaya ditandai final.') : undefined} />
          {isStaff ? <AssignmentHistory d={d} /> : null}
          {isStaff ? <StaffSecondary d={d} setSheet={setSheet} /> : null}
          {isDriver && d.allowedActions.includes('abort') ? (
            <View style={{ marginTop: space.xxl, gap: space.xs }}>
              <Button label="Hentikan perjalanan…" icon="alert-octagon-outline" variant="danger" onPress={() => setSheet({ kind: 'abort' })} />
              <Txt variant="caption" tone="inkSecondary">Hanya bila perjalanan tidak dapat dilanjutkan setelah kendaraan dimuat. Wajib mencatat lokasi, penguasaan kendaraan, PIC, dan rencana.</Txt>
            </View>
          ) : null}
        </>
      ) : null}
      <OrderSheets sheet={sheet} onClose={() => setSheet(null)} submit={submit} isStaff={isStaff} />
    </Screen>
  );
}

function StaffSecondary({ d, setSheet }: { d: OrderDetail; setSheet: (s: SheetKind) => void }) {
  const a = d.allowedActions;
  if (!a.includes('propose_change') && !a.includes('cancel') && !a.includes('abort')) return null;
  return (
    <View>
      <SectionTitle title="Tindakan lain" />
      <View style={styles.secondary}>
        {a.includes('propose_change') ? <Button label="Ajukan biaya tambahan" icon="cash-plus" variant="secondary" onPress={() => setSheet({ kind: 'change' })} /> : null}
        {a.includes('report_incident') ? <Button label="Catat kendala" icon="alert-outline" variant="secondary" onPress={() => setSheet({ kind: 'incident' })} /> : null}
        {a.includes('cancel') ? <Button label="Batalkan order" icon="cancel" variant="danger" onPress={() => setSheet({ kind: 'cancel' })} /> : null}
        {a.includes('abort') ? <Button label="Hentikan perjalanan" icon="alert-octagon-outline" variant="danger" onPress={() => setSheet({ kind: 'abort' })} /> : null}
      </View>
    </View>
  );
}

function Footer({
  d,
  isDriver,
  isStaff,
  busy,
  runTrip,
  setSheet,
  act,
}: {
  d: OrderDetail;
  isDriver: boolean;
  isStaff: boolean;
  busy: OrderAction | null;
  runTrip: (a: TripAction) => void;
  setSheet: (s: SheetKind) => void;
  act: (a: OrderAction, fn: () => Promise<unknown>, ok: string) => Promise<void>;
}) {
  const router = useRouter();
  const api = useApi();
  const a = d.allowedActions;
  const id = d.summary.id;

  if (isDriver) {
    if (a.includes('accept_assignment')) {
      return (
        <View style={styles.row}>
          <Button label="Tolak" variant="danger" style={{ flex: 1 }} onPress={() => setSheet({ kind: 'reject' })} />
          <Button label="Terima tugas" size="lg" style={{ flex: 2 }} loading={busy === 'accept_assignment'} onPress={() => void act('accept_assignment', () => api.respondAssignment(id, true, null), 'Tugas diterima. Order kini ditugaskan kepada Anda.')} />
        </View>
      );
    }
    const next = d.nextAction;
    return (
      <>
        {next ? (
          <>
            <Button
              label={next.label}
              size="lg"
              icon={next.action === 'handover' ? 'handshake-outline' : 'arrow-right-circle-outline'}
              loading={busy === next.action}
              accessibilityHint={next.hint}
              onPress={() => (next.action === 'handover' ? router.push(`/order/${id}/handover`) : runTrip(next.action as TripAction))}
            />
            <Txt variant="caption" tone="inkSecondary" align="center">{next.hint}</Txt>
          </>
        ) : (
          <Txt variant="bodySm" tone="inkSecondary" align="center">Tidak ada tahap yang perlu Anda tekan sekarang.</Txt>
        )}
        {a.includes('report_incident') ? (
          <View style={styles.row}>
            <Button label="Kendala" icon="alert-outline" variant="secondary" compact style={{ flex: 1 }} onPress={() => setSheet({ kind: 'incident' })} />
            <Button label="Biaya" icon="cash" variant="secondary" compact style={{ flex: 1 }} onPress={() => setSheet({ kind: 'expense' })} />
            <Button label="Foto" icon="camera-outline" variant="secondary" compact style={{ flex: 1 }} onPress={() => router.push(`/order/${id}/evidence`)} />
          </View>
        ) : null}
      </>
    );
  }

  if (isStaff) {
    if (a.includes('issue_invoice')) {
      return <Button label="Terbitkan invoice" icon="file-document-plus-outline" size="lg" loading={busy === 'issue_invoice'} onPress={() => void act('issue_invoice', () => api.issueInvoice(id), 'Invoice terbit dari penawaran yang disetujui.')} />;
    }
    if (a.includes('manage_assignment')) {
      return <Button label="Atur penugasan" icon="account-switch-outline" size="lg" onPress={() => router.push(`/order/${id}/assign`)} />;
    }
    if (a.includes('close')) {
      return <Button label="Tutup order" icon="archive-check-outline" size="lg" loading={busy === 'close'} onPress={() => void act('close', () => api.closeOrder(id), 'Order ditutup. Piutang tetap tercatat bila ada.')} />;
    }
    if (a.includes('view_tracking')) {
      return <Button label="Lihat lokasi & tahap" icon="map-marker-path" size="lg" variant="secondary" onPress={() => router.push(`/order/${id}/tracking`)} />;
    }
    return null;
  }

  // Pelanggan
  return (
    <>
      {a.includes('view_tracking') ? <Button label="Lihat perjalanan" icon="map-marker-path" size="lg" onPress={() => router.push(`/order/${id}/tracking`)} /> : null}
      {a.includes('approve_change') ? (
        <Button label="Putuskan biaya tambahan" icon="cash-plus" variant="secondary" onPress={() => setSheet({ kind: 'decide', changeId: d.changeOrders.find((c) => c.status === 'pending')!.id })} />
      ) : null}
      {a.includes('reorder') ? (
        <Button
          label="Pesan ulang"
          icon="repeat"
          variant="secondary"
          loading={busy === 'reorder'}
          onPress={() =>
            void act('reorder', async () => {
              const r = await api.reorder(id);
              router.push(`/request/${r.id}`);
            }, 'Draf baru dibuat. Harga, unit, jadwal dan penerima dikonfirmasi ulang.')
          }
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  secondary: { gap: space.sm },
});
