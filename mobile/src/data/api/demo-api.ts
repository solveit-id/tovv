import type { DemoStore } from '@/data/demo/store';
import { makeCtx, type Ctx } from '@/data/demo/ctx';
import { scopesFor } from '@/data/demo/policy';
import { dailyActions } from '@/data/demo/daily-actions';
import * as rq from '@/data/demo/ops-requests';
import * as od from '@/data/demo/ops-orders';
import * as fin from '@/data/demo/ops-finance';
import * as adm from '@/data/demo/ops-admin';
import * as auth from '@/data/demo/auth';
import { liveMap } from '@/data/demo/live-map';
import { ApiError } from './contract';
import type { ViewGroup } from '@/domain/types';

export interface SessionRef {
  userId: string;
  view: ViewGroup;
}

/**
 * Adapter DEMO — SIMULASI FRONTEND. Semua method meniru endpoint INTEGRATION_PLAN §3 dan dapat
 * diganti adapter HTTP dengan tipe yang sama. Tidak ada jaringan, backend, atau penyimpanan server.
 */
export function createDemoApi(store: DemoStore, session: () => SessionRef | null, latencyMs = { read: 160, write: 260 }) {
  const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());
  const ctx = (): Ctx => {
    const s = session();
    if (!s) throw new ApiError('FORBIDDEN', 'Belum ada sesi demo. Pilih akun demo.');
    return makeCtx(store, s.userId, s.view);
  };
  const read = async <T>(fn: (c: Ctx) => T): Promise<T> => {
    await sleep(latencyMs.read);
    if (store.db.faults.failNextRead) {
      store.transact((db) => void (db.faults.failNextRead = false));
      throw new ApiError('UNAVAILABLE', 'Sumber data demo sengaja dibuat gagal sekali (simulasi). Coba lagi.', true);
    }
    return fn(ctx());
  };
  const write = async <T>(fn: (c: Ctx) => T): Promise<T> => {
    await sleep(latencyMs.write);
    return fn(ctx());
  };

  return {
    mode: 'frontend_demo' as const,
    now: () => store.now(),

    // Identitas
    /** Kata sandi bersama akun fixture; hanya ada di adapter demo, tidak di API produksi. */
    demoPassword: auth.DEMO_PASSWORD,
    listDemoAccounts: async () => adm.listDemoAccounts(store.db),
    login: async (email: string, password: string) => {
      await sleep(latencyMs.write);
      return auth.login(store.db, email, password);
    },
    register: async (input: auth.RegisterInput) => {
      await sleep(latencyMs.write);
      return store.transact((db) => auth.register(db, input));
    },
    requestPasswordReset: async (email: string) => {
      await sleep(latencyMs.write);
      return auth.requestPasswordReset(email);
    },
    validateSession: async (s: SessionRef) => {
      const user = store.db.users.find((u) => u.id === s.userId);
      if (!user) throw new ApiError('FORBIDDEN', 'Akun demo tidak ada.');
      const c = makeCtx(store, s.userId, s.view);
      if (!adm.sessionContext(c).views.includes(s.view)) throw new ApiError('FORBIDDEN', 'Konteks tampilan tidak dimiliki akun ini.');
      return adm.sessionContext(c);
    },
    getSession: () => read(adm.sessionContext),

    // Beranda & laporan
    getDailyActions: () => read((c) => dailyActions(store.db, c.actor, scopesFor(store.db, c.actor, c.now), c.now)),
    getOwnerSummary: () => read(adm.ownerSummary),
    getAnalytics: (businessAccountId: string | null) => read((c) => adm.analyticsReport(c, businessAccountId)),
    exportCsv: (template: 'REP-05' | 'REP-06' | 'REP-07', businessAccountId: string | null) => write((c) => adm.exportCsv(c, template, businessAccountId)),

    // Permintaan & penawaran
    listRequests: (filter: 'open' | 'all') => read((c) => rq.listRequests(c, filter)),
    getRequest: (id: string) => read((c) => rq.getRequest(c, id)),
    listCustomers: () => read(rq.listCustomers),
    listPlaces: async () => rq.demoPlaces(),
    getCaptureContext: (id: string) => read((c) => rq.captureContext(c, id)),
    createRequest: (input: Parameters<typeof rq.createRequest>[1]) => write((c) => rq.createRequest(c, input)),
    submitDraft: (id: string) => write((c) => rq.submitDraft(c, id)),
    completeReview: (id: string, spec: Parameters<typeof rq.completeReview>[2]) => write((c) => rq.completeReview(c, id, spec)),
    cancelRequest: (id: string, reason: string) => write((c) => rq.cancelRequest(c, id, reason)),
    getUnitCandidates: (requestId: string, start: string, end: string) => read((c) => rq.unitCandidates(c, requestId, start, end)),
    sendQuote: (input: Parameters<typeof rq.sendQuote>[1]) => write((c) => rq.sendQuote(c, input)),
    getQuote: (id: string) => read((c) => rq.getQuote(c, id)),
    acceptQuote: (id: string, opts: rq.AcceptOptions) => write((c) => rq.acceptQuote(c, id, opts)),
    rejectQuote: (id: string, reason: string, endRequest: boolean) => write((c) => rq.rejectQuote(c, id, reason, endRequest)),
    reorder: (orderId: string) => write((c) => rq.reorder(c, orderId)),

    // Order & perjalanan
    listOrders: (filter: od.OrderListFilter) => read((c) => od.listOrders(c, filter)),
    getOrder: (id: string) => read((c) => od.getOrder(c, id)),
    getTracking: (id: string) => read((c) => od.getTracking(c, id)),
    getLiveMap: () => read(liveMap),
    offerAssignment: (orderId: string, driverId: string) => write((c) => od.offerAssignment(c, orderId, driverId)),
    respondAssignment: (orderId: string, accept: boolean, reason: string | null) => write((c) => od.respondAssignment(c, orderId, accept, reason)),
    advanceTrip: (orderId: string, action: Parameters<typeof od.advanceTrip>[2], exceptionReason: string | null) => write((c) => od.advanceTrip(c, orderId, action, exceptionReason)),
    markReadiness: (orderId: string, patch: Parameters<typeof od.markReadiness>[2]) => write((c) => od.markReadiness(c, orderId, patch)),
    reportIncident: (orderId: string, type: Parameters<typeof od.reportIncident>[2], note: string) => write((c) => od.reportIncident(c, orderId, type, note)),
    resolveIncident: (id: string, followUp: string) => write((c) => od.resolveIncident(c, id, followUp)),
    proposeChange: (orderId: string, amount: number, reason: string) => write((c) => od.proposeChange(c, orderId, amount, reason)),
    decideChange: (id: string, approve: boolean, note: string | null) => write((c) => od.decideChange(c, id, approve, note)),
    handover: (orderId: string, input: od.HandoverInput) => write((c) => od.handover(c, orderId, input)),
    cancelOrder: (orderId: string, reason: string) => write((c) => od.cancelOrder(c, orderId, reason)),
    abortOrder: (orderId: string, info: Parameters<typeof od.abortOrder>[2]) => write((c) => od.abortOrder(c, orderId, info)),
    closeOrder: (orderId: string) => write((c) => od.closeOrder(c, orderId)),
    listExpenses: () => read(od.listExpenses),
    addExpense: (orderId: string, category: string, amount: number, note: string) => write((c) => od.addExpense(c, orderId, category, amount, note)),
    decideExpense: (id: string, approve: boolean) => write((c) => od.decideExpense(c, id, approve)),
    finalizeCosts: (orderId: string) => write((c) => od.finalizeCosts(c, orderId)),
    listAdvances: () => read(od.listAdvances),
    captureMedia: (input: Parameters<typeof od.captureMedia>[1]) => write((c) => od.captureMedia(c, input)),
    listOutbox: () => read(od.listOutbox),
    syncOutbox: () => write(od.syncOutbox),

    // Keuangan
    listInvoices: (filter: 'open' | 'all') => read((c) => fin.listInvoices(c, filter)),
    getInvoice: (id: string) => read((c) => fin.getInvoice(c, id)),
    issueInvoice: (orderId: string) => write((c) => fin.issueInvoice(c, orderId)),
    createPaymentRequest: (invoiceId: string, amount: number, expiryHours: number) => write((c) => fin.createPaymentRequest(c, invoiceId, amount, expiryHours)),
    getPaymentRequest: (id: string) => read((c) => fin.getPaymentRequest(c, id)),
    submitProof: (input: Parameters<typeof fin.submitProof>[1]) => write((c) => fin.submitProof(c, input)),
    listProofs: (filter: 'review' | 'all') => read((c) => fin.listProofs(c, filter)),
    getProof: (id: string) => read((c) => fin.getProof(c, id)),
    verifyProof: (input: Parameters<typeof fin.verifyProof>[1]) => write((c) => fin.verifyProof(c, input)),
    rejectProof: (id: string, reason: string) => write((c) => fin.rejectProof(c, id, reason)),
    addCreditNote: (invoiceId: string, amount: number, reason: string) => write((c) => fin.addCreditNote(c, invoiceId, amount, reason)),
    recordRefund: (receiptId: string, amount: number, reason: string) => write((c) => fin.recordRefund(c, receiptId, amount, reason)),
    reverseVerification: (proofId: string, reason: string) => write((c) => fin.reverseVerification(c, proofId, reason)),

    // Admin owner
    getFleet: () => read(adm.fleet),
    listBusinessAccounts: () => read(adm.businessAccounts),
    getSaas: () => read(adm.saas),
    schedulePlanChange: (kind: 'subscription' | 'success') => write((c) => adm.schedulePlanChange(c, kind)),
    listDelegations: () => read(adm.listDelegations),
    listAdmins: () => read(adm.listAdmins),
    grantDelegation: (input: Parameters<typeof adm.grantDelegation>[1]) => write((c) => adm.grantDelegation(c, input)),
    revokeDelegation: (id: string) => write((c) => adm.revokeDelegation(c, id)),
    listSupportGrants: () => read(adm.listSupportGrants),
    approveSupportGrant: (scopes: string[], hours: number, reason: string) => write((c) => adm.approveSupportGrant(c, scopes, hours, reason)),
    revokeSupportGrant: (id: string) => write((c) => adm.revokeSupportGrant(c, id)),
    listInbox: () => read(adm.inbox),
    markInboxRead: (id: string) => write((c) => adm.markInboxRead(c, id)),

    // Mode demo
    getFaults: async () => ({ ...store.db.faults }),
    setFault: async <K extends keyof DemoStoreFaults>(key: K, value: DemoStoreFaults[K]) => {
      store.transact((db) => {
        (db.faults as DemoStoreFaults)[key] = value;
      });
    },
    resetDemo: () => store.reset(),
  };
}

type DemoStoreFaults = DemoStore['db']['faults'];
export type TovvApi = ReturnType<typeof createDemoApi>;
