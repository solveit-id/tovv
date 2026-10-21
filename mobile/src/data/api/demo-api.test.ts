import { createDemoApi, type SessionRef } from './demo-api';
import { DemoStore, memoryPersistence } from '@/data/demo/store';
import { ApiError } from './contract';
import { csvCell } from '@/core/format/csv';
import { addMinutes } from '@/core/format/time';

function setup() {
  const store = new DemoStore(memoryPersistence(), undefined, Date.now());
  let session: SessionRef | null = null;
  const api = createDemoApi(store, () => session, { read: 0, write: 0 });
  const as = (userId: string, view: SessionRef['view']) => {
    session = { userId, view };
  };
  return { store, api, as };
}

async function expectCode(p: Promise<unknown>, code: ApiError['code']) {
  await expect(p).rejects.toMatchObject({ code });
}

const newPhoneRequest = {
  channel: 'phone' as const,
  customerUserId: 'customer-a1',
  businessAccountId: null,
  parties: { orderer: 'Wulan Sari', sender: 'Wulan Sari', receiver: 'Bengkel tujuan', payer: 'Wulan Sari' },
  vehicle: { label: 'SUV', plate: 'L 9999 DMO', weightKg: 1800, lengthMm: 4500, widthMm: 1800, condition: 'Mogok' },
  pickup: { label: 'Rumah', address: 'Jl. Contoh No. 1, Surabaya', lat: -7.2797, lng: 112.7676 },
  dropoff: { label: 'Bengkel', address: 'Jl. Contoh No. 2, Sidoarjo', lat: -7.4478, lng: 112.7183 },
  timing: { kind: 'scheduled' as const, start: '2026-10-22T02:00:00.000Z', end: null },
  poRef: null,
  consentNote: 'Pelanggan menelepon dan menyetujui pencatatan',
  asDraft: false,
  idempotencyKey: 'test-key-1',
};

describe('D-01 permintaan telepon → penawaran → persetujuan', () => {
  it('U1 terdekat ditolak karena kapasitas; U2 dan mitra P1 layak', async () => {
    const { api, as } = setup();
    as('admin-a1', 'admin');
    const req = await api.createRequest(newPhoneRequest);
    expect(req.status).toBe('ready_to_quote');
    const cands = await api.getUnitCandidates(req.id, '2026-10-22T02:00:00.000Z', '2026-10-22T04:00:00.000Z');
    const u1 = cands.find((c) => c.code === 'U1')!;
    expect(u1.eligible).toBe(false);
    expect(u1.rejections[0]).toMatch(/Kapasitas 1\.500 kg < berat 1\.800 kg/);
    expect(cands.find((c) => c.code === 'U3')!.eligible).toBe(false);
    expect(cands.filter((c) => c.eligible).map((c) => c.code).sort()).toEqual(['P1', 'U2']);
  });

  it('idempotensi: key sama payload sama → satu request; payload beda → 409', async () => {
    const { api, as, store } = setup();
    as('admin-a1', 'admin');
    const a = await api.createRequest(newPhoneRequest);
    const b = await api.createRequest(newPhoneRequest);
    expect(a.id).toBe(b.id);
    expect(store.db.requests.filter((r) => r.idempotencyKey === 'test-key-1')).toHaveLength(1);
    await expectCode(api.createRequest({ ...newPhoneRequest, poRef: 'X' }), 'VERSION_CONFLICT');
  });

  it('delegasi: admin-A1 boleh diskon ≤ 100.000; admin-A2 tanpa delegasi harus eskalasi', async () => {
    const { api, as } = setup();
    as('admin-a1', 'admin');
    const req = await api.createRequest(newPhoneRequest);
    const base = { requestId: req.id, unitId: 'A-U2', scheduleStart: '2026-10-22T02:00:00.000Z', scheduleEnd: '2026-10-22T04:00:00.000Z', direct: 900_000, allocation: 150_000, reserve: 50_000, targetSurplus: 200_000, priority: null, validHours: 24 };
    // target = 1.300.000
    await expectCode(api.sendQuote({ ...base, price: 1_250_000, belowTargetReason: null }), 'VALIDATION');
    const q = await api.sendQuote({ ...base, price: 1_250_000, belowTargetReason: 'Pelanggan berulang' });
    expect(q.version).toBe(1);
    await expectCode(api.sendQuote({ ...base, price: 1_150_000, belowTargetReason: 'Terlalu murah' }), 'ESCALATION_REQUIRED');
    as('admin-a2', 'admin');
    await expectCode(api.sendQuote({ ...base, price: 1_300_000, belowTargetReason: null }), 'ESCALATION_REQUIRED');
    as('owner-a', 'owner');
    const v2 = await api.sendQuote({ ...base, price: 1_100_000, belowTargetReason: 'Keputusan owner' });
    expect(v2.version).toBe(2);
    expect((await api.getQuote(q.id)).status).toBe('superseded');
  });

  it('persetujuan: versi lama ditolak, versi baru membuat order dan reservasi; unit bentrok → 409', async () => {
    const { api, as } = setup();
    as('owner-a', 'owner');
    const req = await api.createRequest(newPhoneRequest);
    const base = { requestId: req.id, unitId: 'A-U2', direct: 900_000, allocation: 150_000, reserve: 50_000, targetSurplus: 200_000, priority: null, validHours: 24, belowTargetReason: null, price: 1_300_000 };
    const v1 = await api.sendQuote({ ...base, scheduleStart: '2026-10-22T02:00:00.000Z', scheduleEnd: '2026-10-22T04:00:00.000Z' });
    const v2 = await api.sendQuote({ ...base, scheduleStart: '2026-10-22T02:00:00.000Z', scheduleEnd: '2026-10-22T04:00:00.000Z' });
    as('customer-a1', 'customer');
    await expectCode(api.acceptQuote(v1.id, {}), 'QUOTE_SUPERSEDED');
    const { orderId } = await api.acceptQuote(v2.id, {});
    const o = await api.getOrder(orderId);
    expect(o.summary.status).toBe('confirmed');
    expect(o.internal).toBeNull();
    expect(o.quote?.internal).toBeNull();
    // permintaan kedua pada unit dan waktu yang sama
    as('owner-a', 'owner');
    const req2 = await api.createRequest({ ...newPhoneRequest, idempotencyKey: 'test-key-2' });
    const q2 = await api.sendQuote({ ...base, requestId: req2.id, scheduleStart: '2026-10-22T03:00:00.000Z', scheduleEnd: '2026-10-22T05:00:00.000Z' });
    as('customer-a1', 'customer');
    await expectCode(api.acceptQuote(q2.id, {}), 'CAPACITY_CONFLICT');
    expect((await api.getQuote(q2.id)).status).toBe('sent');
  });
});

describe('B2B mandat dan PO (BIZ-02, BIZ-05)', () => {
  it('requester tidak dapat menyetujui; approver wajib PO untuk BA1', async () => {
    const { api, as } = setup();
    as('owner-a', 'owner');
    const req = await api.createRequest({ ...newPhoneRequest, channel: 'b2b', customerUserId: 'ba1-req', businessAccountId: 'ba1', idempotencyKey: 'b2b-1', consentNote: 'Dicatat dari email requester' });
    const q = await api.sendQuote({ requestId: req.id, unitId: 'A-U2', scheduleStart: '2026-10-23T02:00:00.000Z', scheduleEnd: '2026-10-23T04:00:00.000Z', price: 1_300_000, direct: 900_000, allocation: 150_000, reserve: 50_000, targetSurplus: 200_000, priority: null, belowTargetReason: null, validHours: 24 });
    as('ba1-req', 'customer');
    await expectCode(api.acceptQuote(q.id, {}), 'FORBIDDEN');
    as('ba1-appr', 'customer');
    await expectCode(api.acceptQuote(q.id, {}), 'VALIDATION');
    const res = await api.acceptQuote(q.id, { poRef: 'DEMO-PO-NEW' });
    expect(res.orderId).toBeTruthy();
  });

  it('organisasi lain dan tenant lain terisolasi', async () => {
    const { api, as } = setup();
    as('ba2-req', 'customer');
    await expectCode(api.getOrder('O-A01'), 'NOT_FOUND');
    as('customer-b1', 'customer');
    await expectCode(api.getOrder('O-A06'), 'NOT_FOUND');
    as('ba1-req', 'customer');
    // requester BA1 bukan finance: invoice organisasi tidak terlihat
    await expectCode(api.getInvoice('I-A01'), 'NOT_FOUND');
    as('ba1-appr', 'customer');
    expect((await api.getInvoice('I-A01')).number).toMatch(/^INV\/A\/2026\//);
  });
});

describe('D-07 owner-driver dan delegasi', () => {
  it('owner dalam mode driver tidak memegang izin owner', async () => {
    const { api, as } = setup();
    as('owner-a', 'driver');
    await expectCode(api.getOwnerSummary(), 'FORBIDDEN');
    const tasks = await api.listOrders('active');
    expect(tasks.map((t) => t.alias)).toEqual(['A06']);
  });

  it('revoke delegasi menghentikan tindakan berikutnya', async () => {
    const { api, as } = setup();
    as('owner-a', 'owner');
    const ds = await api.listDelegations();
    await api.revokeDelegation(ds[0]!.id);
    as('admin-a1', 'admin');
    const session = await api.getSession();
    expect(session.delegation).toBeNull();
    expect(session.scopes).not.toContain('quote.send');
  });
});

describe('D-03 perjalanan, bukti dan offline', () => {
  it('driver-A2 menerima A07, pickup wajib foto atau alasan, event offline masuk antrean', async () => {
    const { api, as, store } = setup();
    as('driver-a2', 'driver');
    let o = await api.respondAssignment('O-A07', true, null);
    expect(o.summary.status).toBe('assigned');
    o = await api.advanceTrip('O-A07', 'start_pickup', null);
    o = await api.advanceTrip('O-A07', 'arrive_pickup', null);
    await expectCode(api.advanceTrip('O-A07', 'start_loading', null), 'VALIDATION');
    await api.setFault('offline', true);
    o = await api.advanceTrip('O-A07', 'start_loading', 'Hujan deras, foto menyusul di tempat teduh');
    expect(o.timeline.find((t) => t.status === 'loading')?.state).toBe('pending_sync');
    expect((await api.listOutbox())[0]!.status).toBe('pending');
    await expectCode(api.acceptQuote('Q-A13-v1', {}), 'OFFLINE');
    await expectCode(api.syncOutbox(), 'OFFLINE');
    await api.setFault('offline', false);
    const synced = await api.syncOutbox();
    expect(synced[0]!.status).toBe('synced');
    expect(store.db.orders.find((x) => x.id === 'O-A07')!.events.every((e) => e.source === 'server')).toBe(true);
  });

  it('driver lain tidak dapat melihat tugas yang bukan miliknya', async () => {
    const { api, as } = setup();
    as('driver-a1', 'driver');
    await expectCode(api.getOrder('O-A07'), 'NOT_FOUND');
  });

  it('tracking customer tersembunyi sebelum berangkat; replay berlabel simulasi', async () => {
    const { api, as } = setup();
    as('ba2-appr', 'customer');
    const t = await api.getTracking('O-A06');
    expect(t.visible).toBe(true);
    expect(t.source).toBe('simulated');
    expect(t.freshness).toBe('live');
    as('customer-a1', 'customer');
    const t2 = await api.getTracking('O-A07');
    expect(t2.visible).toBe(false);
  });

  it('replay dijeda menjadi stale setelah 90 detik, tidak mengarang titik', async () => {
    const { api, as, store } = setup();
    as('owner-a', 'owner');
    await api.setFault('replayPausedAt', addMinutes(store.now(), -2));
    const t = await api.getTracking('O-A06');
    expect(t.freshness).toBe('stale');
    expect(t.ageSeconds!).toBeGreaterThan(90);
  });
});

describe('D-04 invoice → bukti → pemeriksaan', () => {
  it('bukti pending tidak mengubah saldo; verifikasi sebagian; tidak ada receipt kedua; lebih bayar unapplied', async () => {
    const { api, as } = setup();
    as('finance-a', 'admin');
    const inv = await api.issueInvoice('O-A05');
    expect(inv.gross).toBe('1300000');
    const pr = await api.createPaymentRequest(inv.id, 500_000, 24);
    expect(pr.deepLink).toBe(`tovv-demo://payment-request/${pr.id}`);
    await expectCode(api.createPaymentRequest(inv.id, 2_000_000, 24), 'VALIDATION');

    as('customer-a2', 'customer');
    const proof = await api.submitProof({ invoiceId: inv.id, paymentRequestId: pr.id, amount: 500_000, method: 'transfer_demo', reference: 'TRF-NEW-001', eventAt: '2026-10-21T04:50:00.000Z', assistedReason: null, attachmentLabel: 'bukti' });
    expect(proof.status).toBe('pending_review');
    expect((await api.getInvoice(inv.id)).outstanding).toBe('1300000');

    as('finance-a', 'admin');
    const verified = await api.verifyProof({ proofId: proof.id, amountVerified: 500_000, receivedEventAt: '2026-10-21T04:50:00.000Z', custody: 'operator_demo', reason: 'Sesuai catatan demo', duplicateResolution: null });
    expect(verified.status).toBe('verified');
    expect((await api.getInvoice(inv.id)).outstanding).toBe('800000');
    await expectCode(api.verifyProof({ proofId: proof.id, amountVerified: 500_000, receivedEventAt: '2026-10-21T04:50:00.000Z', custody: 'operator_demo', reason: 'ulang', duplicateResolution: null }), 'PROOF_ALREADY_REVIEWED');

    as('customer-a2', 'customer');
    const over = await api.submitProof({ invoiceId: inv.id, paymentRequestId: null, amount: 900_000, method: 'transfer_demo', reference: 'TRF-NEW-002', eventAt: '2026-10-21T04:55:00.000Z', assistedReason: null, attachmentLabel: 'bukti' });
    as('finance-a', 'admin');
    await api.verifyProof({ proofId: over.id, amountVerified: 900_000, receivedEventAt: '2026-10-21T04:55:00.000Z', custody: 'operator_demo', reason: 'Lebih bayar', duplicateResolution: null });
    const after = await api.getInvoice(inv.id);
    expect(after.outstanding).toBe('0');
    expect(after.receipts.find((r) => r.amount === '900000')!.unapplied).toBe('100000');
  });

  it('referensi mirip memberi flagged_review dan butuh keputusan; pengaju tidak bisa memeriksa sendiri', async () => {
    const { api, as } = setup();
    as('owner-a', 'owner');
    const proof = await api.submitProof({ invoiceId: 'I-A02', paymentRequestId: null, amount: 1_000_000, method: 'transfer_demo', reference: 'trf-demo-a03', eventAt: '2026-10-21T04:00:00.000Z', assistedReason: 'Bukti dari chat pelanggan', attachmentLabel: 'bukti' });
    expect(proof.status).toBe('flagged_review');
    await expectCode(api.verifyProof({ proofId: proof.id, amountVerified: 1_000_000, receivedEventAt: '2026-10-21T04:00:00.000Z', custody: 'operator_demo', reason: 'ok', duplicateResolution: 'x' }), 'SELF_APPROVAL');
    as('finance-a', 'admin');
    await expectCode(api.verifyProof({ proofId: proof.id, amountVerified: 1_000_000, receivedEventAt: '2026-10-21T04:00:00.000Z', custody: 'operator_demo', reason: 'ok', duplicateResolution: null }), 'DUPLICATE_REFERENCE_REVIEW_REQUIRED');
  });

  it('reversal receipt A10 yang sudah memiliki refund ditolak (dependency guard)', async () => {
    const { api, as } = setup();
    as('finance-a', 'admin');
    await expectCode(api.reverseVerification('PF-A10', 'uji'), 'DEPENDENT_FINANCIAL_ENTRY');
  });

  it('dashboard berubah dari transaksi yang sama, bukan angka terpisah', async () => {
    const { api, as } = setup();
    as('owner-a', 'owner');
    const before = await api.getOwnerSummary();
    expect(before.money.find((m) => m.key === 'receivable')!.amount).toBe('2200000');
    as('finance-a', 'admin');
    await api.issueInvoice('O-A05');
    as('owner-a', 'owner');
    const after = await api.getOwnerSummary();
    expect(after.money.find((m) => m.key === 'receivable')!.amount).toBe('3500000');
    expect(after.money.find((m) => m.key === 'invoice_net')!.amount).toBe('7800000');
  });
});

describe('daftar tindakan harian (FIN-05)', () => {
  it('owner melihat item dari sumber dengan PIC, tanpa duplikat', async () => {
    const { api, as } = setup();
    as('owner-a', 'owner');
    const items = await api.getDailyActions();
    const types = items.map((i) => `${i.sourceId}:${i.type}`);
    expect(types).toEqual(expect.arrayContaining(['O-A05:handover_not_invoiced', 'IC-A06-1:incident_open', 'CO-A06-1:change_pending', 'AS-A07-2:assignment_pending', 'R-A14:needs_review']));
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
    items.forEach((i) => expect(i.picName).toBeTruthy());
  });

  it('item hilang hanya ketika sumber resolved', async () => {
    const { api, as } = setup();
    as('finance-a', 'admin');
    await api.issueInvoice('O-A05');
    as('owner-a', 'owner');
    const items = await api.getDailyActions();
    expect(items.some((i) => i.sourceId === 'O-A05' && i.type === 'handover_not_invoiced')).toBe(false);
  });
});

describe('ekspor CSV aman', () => {
  it('escape formula dan metadata DEMO', async () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell('-200000')).toBe('-200000');
    expect(csvCell('a,b')).toBe('"a,b"');
    const { api, as } = setup();
    as('owner-a', 'owner');
    const r = await api.exportCsv('REP-06', null);
    expect(r.content.split('\n')[0]).toMatch(/^DEMO,/);
    expect(r.content).toContain('formula_version');
    as('customer-a1', 'customer');
    await expectCode(api.exportCsv('REP-05', null), 'FORBIDDEN');
  });
});

describe('DTO per peran (TEN-03)', () => {
  it('driver tidak menerima harga, biaya tambahan, tagihan, PO, atau pembayar', async () => {
    const { api, as } = setup();
    as('owner-a', 'driver');
    const o = await api.getOrder('O-A06');
    expect(o.quote).toBeNull();
    expect(o.changeOrders).toEqual([]);
    expect(o.invoices).toEqual([]);
    expect(o.internal).toBeNull();
    expect(o.poRef).toBeNull();
    expect(o.parties.payer).toBe('—');
  });
});
