import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { LineItem, Money, Rule, SectionTitle, Serial, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { PhotoTile } from '@/components/business/photo-tile';
import { useToast } from '@/components/feedback/toast';
import type { OrderDetail } from '@/data/api/contract';
import {
  assignmentStatus,
  changeOrderStatus,
  collectionStatus,
  costLook,
  evidenceLook,
  executionStatus,
  expenseStatus,
  stageLabel,
  timingLabel,
  channelLabel,
} from '@/core/i18n/status';
import { formatDateTime, formatShortDateTime, formatTime } from '@/core/format/time';
import { formatNumber, formatRupiah } from '@/core/format/money';
import { t } from '@/core/i18n';

function Place({ kind, label, address, time }: { kind: 'Jemput' | 'Tujuan'; label: string; address: string; time?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.place}>
      <View style={[styles.pin, kind === 'Tujuan' && styles.pinEnd]} />
      <View style={{ flex: 1 }}>
        <Txt variant="label" tone="inkSecondary">{kind}{time ? ` · ${time}` : ''}</Txt>
        <Txt variant="bodyStrong">{label}</Txt>
        <Txt variant="bodySm" tone="inkSecondary">{address}</Txt>
      </View>
    </View>
  );
}

/** Lembar surat jalan: identitas pekerjaan, kendaraan, rute, jadwal, unit dan petugas. */
export function TripDocument({ d }: { d: OrderDetail }) {
  const styles = useStyles();
  const s = d.summary;
  const asg = d.assignments.find((a) => a.status === 'accepted' || a.status === 'offered' || a.status === 'completed');
  return (
    <Card>
      <View style={styles.docHead}>
        <Txt variant="label" tone="inkSecondary">{t('Pekerjaan {0}', [s.alias])}</Txt>
        <Txt variant="caption" tone="inkSecondary">{channelLabel[d.channel]}</Txt>
      </View>
      <View style={styles.tags}>
        <StatusTag look={executionStatus[s.status]} />
        {asg ? <StatusTag look={assignmentStatus[asg.status]} size="sm" label={t('Tugas {0} · {1}', [asg.driverName, assignmentStatus[asg.status].label.toLowerCase()])} /> : null}
      </View>
      <Txt variant="headline" style={{ marginTop: space.md }}>{`${d.vehicle.label} · ${d.vehicle.plate}`}</Txt>
      <Txt variant="bodySm" tone="inkSecondary">
        {`${d.vehicle.weightKg ? `${formatNumber(d.vehicle.weightKg)} kg` : 'Berat belum diketahui'} · ${d.vehicle.lengthMm ? `${formatNumber(d.vehicle.lengthMm)}×${formatNumber(d.vehicle.widthMm ?? 0)} mm` : 'dimensi belum diketahui'} · ${d.vehicle.condition}`}
      </Txt>
      <Rule />
      <View style={{ gap: space.md, marginTop: space.md }}>
        <Place kind="Jemput" label={s.pickup.label} address={s.pickup.address} time={formatTime(s.scheduleStart)} />
        <Place kind="Tujuan" label={s.dropoff.label} address={s.dropoff.address} time={t('selesai ±{0}', [formatTime(s.scheduleEnd)])} />
      </View>
      <View style={styles.metaGrid}>
        <Meta label="Jadwal" value={`${timingLabel[d.timing.kind]} · ${formatShortDateTime(s.scheduleStart)}`} />
        <Meta label="Unit" value={s.unitCode} />
        <Meta label="Sopir" value={s.driverName ?? 'Belum ditugaskan'} />
        <Meta label="Pemesan" value={d.parties.orderer} />
        {d.businessAccountName ? <Meta label="Akun bisnis" value={`${d.businessAccountName}${d.poRef ? ` · ${d.poRef}` : ''}`} /> : null}
        {d.parties.payer !== '—' ? <Meta label="Pembayar" value={d.parties.payer} /> : null}
      </View>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.meta}>
      <Txt variant="label" tone="inkSecondary">{label}</Txt>
      <Txt variant="bodySm">{value}</Txt>
    </View>
  );
}

function Banner({ tone, icon, title, body, children }: { tone: 'warn' | 'danger' | 'info'; icon: string; title: string; body?: string; children?: React.ReactNode }) {
  const color = useColors();
  const styles = useStyles();
  const ink = tone === 'warn' ? 'warnInk' : tone === 'danger' ? 'dangerInk' : 'accentInk';
  const wash = tone === 'warn' ? color.warnWash : tone === 'danger' ? color.dangerWash : color.accentSoft;
  return (
    <View style={[styles.banner, { backgroundColor: wash }]} accessibilityRole="alert">
      <Icon name={icon} size={20} tone={ink} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" tone={ink}>{title}</Txt>
        {body ? <Txt variant="bodySm">{body}</Txt> : null}
        {children}
      </View>
    </View>
  );
}

/** Kendala, kesiapan penerima, dan biaya tambahan yang belum disetujui. */
export function OrderAlerts({ d, onResolve, onDecideChange }: { d: OrderDetail; onResolve?: (id: string) => void; onDecideChange?: (id: string) => void }) {
  const styles = useStyles();
  const open = d.incidents.filter((i) => i.status === 'open');
  const pendingChanges = d.changeOrders.filter((c) => c.status === 'pending');
  if (!open.length && !pendingChanges.length && d.readiness.receiverReady !== false && !d.abortInfo) return null;
  return (
    <View style={{ gap: space.sm, marginTop: space.md }}>
      {d.abortInfo ? (
        <Banner tone="danger" icon="alert-octagon-outline" title="Dihentikan setelah dimuat" body={t('{0}. Kendaraan dipegang: {1}. Penanggung jawab: {2}. Rencana: {3}', [d.abortInfo.location, d.abortInfo.custody, d.abortInfo.pic, d.abortInfo.plan])} />
      ) : null}
      {open.map((i) => (
        <Banner key={i.id} tone="danger" icon="alert-octagon-outline" title={t('Kendala: {0}', [i.typeLabel])} body={t('{0}\nPenanggung jawab {1} · dibuka {2} · {3}', [i.note, i.picName, formatShortDateTime(i.openedAt), i.followUp])}>
          {onResolve ? <Button label="Catat tindak lanjut & tutup" variant="secondary" compact onPress={() => onResolve(i.id)} style={{ marginTop: space.sm, alignSelf: 'flex-start' }} /> : null}
        </Banner>
      ))}
      {d.readiness.receiverReady === false && !open.some((i) => i.type === 'receiver_not_ready') ? (
        <Banner tone="warn" icon="account-clock-outline" title="Penerima belum siap" body={d.readiness.note ?? undefined} />
      ) : null}
      {pendingChanges.map((c) => (
        <Banner key={c.id} tone="warn" icon="cash-plus" title={`Biaya tambahan belum disetujui`} body={t('{0}. Belum masuk tagihan sebelum disetujui pelanggan.', [c.reason])}>
          <View style={styles.inline}>
            <Money value={c.amount} align="left" tone="warnInk" />
            {onDecideChange ? <Button label="Putuskan" compact onPress={() => onDecideChange(c.id)} /> : null}
          </View>
        </Banner>
      ))}
    </View>
  );
}

/** Slot bukti foto per tahap; slot kosong membuka kamera dengan konteks request/order/tahap. */
export function EvidenceSection({ d, canCapture }: { d: OrderDetail; canCapture: boolean }) {
  const styles = useStyles();
  const router = useRouter();
  const extra = d.media.filter((m) => !d.evidenceSlots.some((s) => s.mediaId === m.id));
  const open = (stage: string, slot: string) =>
    router.push({ pathname: '/camera', params: { requestId: d.requestId, orderId: d.summary.id, stage, slot } });
  return (
    <View>
      <SectionTitle
        title="Bukti foto"
        action={<StatusTag look={evidenceLook[d.summary.evidence]} size="sm" />}
      />
      <Card>
        <View style={styles.photos}>
          {d.evidenceSlots.map((s) => {
            const m = d.media.find((x) => x.id === s.mediaId) ?? null;
            return (
              <PhotoTile
                key={s.slot}
                item={m}
                label={s.label}
                onPress={m ? () => router.push({ pathname: '/order/[id]/evidence', params: { id: d.summary.id, focus: m.id } }) : canCapture ? () => open(s.stage, s.slot) : undefined}
              />
            );
          })}
          {extra.map((m) => (
            <PhotoTile key={m.id} item={m} label={stageLabel[m.stage]} onPress={() => router.push({ pathname: '/order/[id]/evidence', params: { id: d.summary.id, focus: m.id } })} />
          ))}
        </View>
        <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.sm }}>
          Foto berlabel SIMULASI adalah contoh, bukan hasil kamera HP. Foto baru dari kamera aplikasi disimpan di HP dulu, lalu dikirim.
        </Txt>
        <Button label="Lihat & bandingkan bukti" variant="quiet" icon="compare" onPress={() => router.push({ pathname: '/order/[id]/evidence', params: { id: d.summary.id } })} style={{ alignSelf: 'flex-start', marginTop: space.xs }} />
      </Card>
    </View>
  );
}

/** Kontak lapangan. Panggilan disimulasikan: nomor DEMO tidak pernah ditelepon. */
export function ContactsSection({ d }: { d: OrderDetail }) {
  const styles = useStyles();
  const toast = useToast();
  const rows = [
    { label: 'Yang menyerahkan kendaraan di lokasi jemput', value: d.pickupContact, ready: d.readiness.pickupReady },
    { label: 'Penerima di tujuan', value: d.receiverContact, ready: d.readiness.receiverReady },
  ];
  return (
    <View>
      <SectionTitle title="Kontak & kesiapan" />
      <Card padded={false}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.contact, i === 0 && styles.divider]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="label" tone="inkSecondary">{r.label}</Txt>
              <Txt variant="body">{r.value}</Txt>
              <Txt variant="caption" tone={r.ready === false ? 'warnInk' : r.ready ? 'okInk' : 'inkSecondary'}>
                {r.ready === false ? 'Belum siap' : r.ready ? 'Siap' : 'Kesiapan belum dicatat'}
              </Txt>
            </View>
            <Button label="Hubungi" icon="phone-outline" variant="secondary" compact onPress={() => toast.show(t('Panggilan ini simulasi: nomor DEMO tidak ditelepon. Di aplikasi sungguhan, tombol ini membuka aplikasi telepon.'), 'info')} />
          </View>
        ))}
      </Card>
    </View>
  );
}

export function InstructionsSection({ d }: { d: OrderDetail }) {
  const styles = useStyles();
  return (
    <View>
      <SectionTitle title="Instruksi" />
      <Card>
        {d.instructions.map((t, i) => (
          <View key={i} style={styles.instr}>
            <Txt variant="bodySm" tone="inkSecondary" tabular>{String(i + 1).padStart(2, '0')}</Txt>
            <Txt variant="body" style={{ flex: 1 }}>{t}</Txt>
          </View>
        ))}
      </Card>
    </View>
  );
}

/** Biaya aktual dan kontribusi — hanya untuk owner/admin (DTO staff). */
export function InternalCostSection({ d, onFinalize }: { d: OrderDetail; onFinalize?: () => void }) {
  const styles = useStyles();
  const i = d.internal;
  if (!i) return null;
  return (
    <View>
      <SectionTitle title="Biaya & kontribusi (internal)" action={d.summary.costCompleteness ? <StatusTag look={costLook[d.summary.costCompleteness]} size="sm" /> : null} />
      <Card>
        <LineItem label="Perkiraan biaya langsung (saat penawaran)" value={<Money value={i.estimateDirect} />} />
        <LineItem label="Biaya langsung aktual disetujui" value={<Money value={i.actualDirect} missingLabel="belum final" />} />
        <Rule />
        <LineItem label="Kontribusi pekerjaan" hint="Pendapatan pekerjaan dikurangi biaya langsung dan biaya layanan Tovv. Bukan laba bersih." value={<Money value={i.contribution} missingLabel={i.reason ?? 'sementara'} />} emphasis />
        {i.advance ? (
          <>
            <Rule />
            <LineItem label="Uang jalan" hint={t('Dikembalikan {0} · sisa {1} masih harus dipertanggungjawabkan', [formatRupiah(i.advance.returned), formatRupiah(i.advance.outstanding)])} value={<Money value={i.advance.amount} />} />
          </>
        ) : null}
        {d.expenses.length ? (
          <View style={{ marginTop: space.sm }}>
            {d.expenses.map((e) => (
              <View key={e.id} style={styles.expense}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodySm">{e.category}</Txt>
                  <Txt variant="caption" tone={e.source === 'local_pending' ? 'warnInk' : 'inkSecondary'}>
                    {`${e.submittedByName} · ${e.source === 'local_pending' ? 'menunggu sinkron' : expenseStatus[e.status].label}`}
                  </Txt>
                </View>
                <Money value={e.amount} size="sm" />
              </View>
            ))}
          </View>
        ) : null}
        {onFinalize && d.summary.costCompleteness === 'provisional' ? (
          <Button label="Tandai biaya final" variant="secondary" icon="check-decagram-outline" onPress={onFinalize} style={{ marginTop: space.md }} />
        ) : null}
      </Card>
    </View>
  );
}

export function InvoicesSection({ d }: { d: OrderDetail }) {
  const styles = useStyles();
  const router = useRouter();
  if (!d.invoices.length) return null;
  return (
    <View>
      <SectionTitle title="Tagihan" />
      <Card padded={false}>
        {d.invoices.map((inv) => (
          <View key={inv.id} style={styles.contact}>
            <View style={{ flex: 1, gap: 4 }}>
              <Serial>{inv.number}</Serial>
              <StatusTag look={collectionStatus[inv.collection]} size="sm" />
              <Txt variant="caption" tone="inkSecondary">{t('Net {0} · sisa', [formatRupiah(inv.net)])}</Txt>
              <Money value={inv.outstanding} align="left" />
            </View>
            <Button label="Buka" variant="secondary" compact onPress={() => router.push(`/invoice/${inv.id}`)} />
          </View>
        ))}
      </Card>
    </View>
  );
}

export function AssignmentHistory({ d }: { d: OrderDetail }) {
  const styles = useStyles();
  if (d.assignments.length < 2) return null;
  return (
    <View>
      <SectionTitle title="Riwayat penugasan" count={d.assignments.length} />
      <Card padded={false}>
        {d.assignments.map((a, i) => (
          <View key={a.id} style={[styles.contact, i < d.assignments.length - 1 && styles.divider]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">{`${a.driverName} · ${a.unitCode}`}</Txt>
              <StatusTag look={assignmentStatus[a.status]} size="sm" />
              <Txt variant="caption" tone="inkSecondary">{t('Ditawarkan {0}{1}', [formatShortDateTime(a.offeredAt), a.reason ? ` · ${a.reason}` : ''])}</Txt>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

export function ChangeOrdersHistory({ d }: { d: OrderDetail }) {
  const done = d.changeOrders.filter((c) => c.status !== 'pending');
  if (!done.length) return null;
  return (
    <View>
      <SectionTitle title="Biaya tambahan" />
      <Card>
        {done.map((c) => (
          <LineItem key={c.id} label={c.reason} hint={`${changeOrderStatus[c.status].label}${c.decidedByName ? ` · ${c.decidedByName}` : ''}`} value={<Money value={c.amount} strike={c.status === 'rejected'} />} />
        ))}
      </Card>
    </View>
  );
}

export function HandoverSummary({ d }: { d: OrderDetail }) {
  if (!d.handover) return null;
  const h = d.handover;
  return (
    <View>
      <SectionTitle title="Serah-terima" />
      <Card>
        <LineItem label="Penerima" value={<Txt variant="bodyStrong">{h.receiverName}</Txt>} />
        <LineItem label="Waktu" value={<Txt variant="bodySm">{formatDateTime(h.at)}</Txt>} />
        <LineItem label="Pernyataan" value={<Txt variant="bodySm" tone={h.acceptance === 'objection' ? 'dangerInk' : 'okInk'}>{h.acceptance === 'objection' ? 'Berkeberatan' : 'Diterima'}</Txt>} />
        {h.objectionNote ? <Txt variant="bodySm" tone="dangerInk">{h.objectionNote}</Txt> : null}
        <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.sm }}>
          Serah-terima tidak sama dengan lunas. Pernyataan penerima dicatat petugas, bukan tanda tangan digital resmi.
        </Txt>
      </Card>
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  docHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  place: { flexDirection: 'row', gap: space.md },
  pin: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: color.accent, backgroundColor: color.surface, marginTop: 4 },
  pinEnd: { borderRadius: 6, backgroundColor: color.dangerInk, borderColor: color.dangerInk },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.lg, rowGap: space.md },
  meta: { flexBasis: '50%', flexGrow: 1, paddingRight: space.sm, gap: 2 },
  banner: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.lg },
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs, gap: space.sm },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  contact: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
  instr: { flexDirection: 'row', gap: space.md, paddingVertical: 6 },
  expense: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
}));
