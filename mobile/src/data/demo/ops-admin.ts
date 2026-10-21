import type { Ctx } from './ctx';
import { activeDelegation, requireScope, viewsFor } from './policy';
import { isStaffView, orderSummary, userName } from './mappers';
import { unitCandidatesForFleet } from './fleet';
import type { DemoDb } from './db';
import {
  ApiError,
  type AnalyticsReport,
  type BusinessAccountDTO,
  type DelegationDTO,
  type DemoAccount,
  type ExportResult,
  type FleetDTO,
  type InboxDTO,
  type OwnerSummary,
  type SaasDTO,
  type SessionContext,
  type SupportGrantDTO,
} from '@/data/api/contract';
import type { DelegationScope, TenantId, User, ViewGroup } from '@/domain/types';
import { computeAnalytics, DEMO_PERIOD, type AnalyticsResult } from '@/domain/analytics';
import { invoiceBalance } from '@/domain/ledger';
import { toMoneyString } from '@/core/format/money';
import { addMinutes, DATASET_GENERATION, formatDateTime } from '@/core/format/time';
import { csvCell } from '@/core/format/csv';

const ROLE_NOTE: Record<string, string> = {
  'owner-a': 'Owner tenant A; juga mengemudi A06 (mode driver terpisah)',
  'admin-a1': 'Dispatcher dengan delegasi owner (8 jam, limit Rp 100.000)',
  'admin-a2': 'Dispatcher tanpa delegasi',
  'finance-a': 'Finance: invoice, pemeriksaan bukti, piutang',
  'driver-a1': 'Driver: riwayat tugas selesai',
  'driver-a2': 'Driver: tawaran tugas A07 menunggu',
  'partner-a': 'Mitra kelolaan (unit P1)',
  'customer-a1': 'Pelanggan pribadi P1',
  'customer-a2': 'Pelanggan pribadi P2 (draf A15, A05 diserahkan)',
  'ba1-req': 'Bengkel Demo · requester (tidak dapat menyetujui harga)',
  'ba1-appr': 'Bengkel Demo · approver & finance organisasi',
  'ba2-req': 'Dealer Demo · requester',
  'ba2-appr': 'Dealer Demo · approver & finance (A06 aktif)',
  'owner-b': 'Owner tenant B (bayar per layanan sukses)',
  'admin-b': 'Dispatcher tenant B',
  'finance-b': 'Finance tenant B (bukti B03 perlu ditinjau)',
  'driver-b1': 'Driver tenant B (B04 ditugaskan)',
  'customer-b1': 'Pelanggan pribadi BP1',
  'bb1-req': 'Bengkel B Demo · requester',
  'bb1-appr': 'Bengkel B Demo · approver & finance',
};

function roleLabel(u: User): string {
  const parts: string[] = [];
  if (u.staffRoles.includes('owner')) parts.push('Owner');
  if (u.staffRoles.includes('dispatcher')) parts.push('Admin dispatcher');
  if (u.staffRoles.includes('finance')) parts.push('Admin finance');
  if (u.staffRoles.includes('driver') && !u.staffRoles.includes('owner')) parts.push('Driver');
  if (u.staffRoles.includes('partner')) parts.push('Mitra');
  if (u.customerKind === 'personal') parts.push('Pelanggan pribadi');
  if (u.customerKind === 'b2b') parts.push(`Pelanggan bisnis (${(u.b2bRoles ?? []).join(', ')})`);
  return parts.join(' · ');
}

export function listDemoAccounts(db: DemoDb): DemoAccount[] {
  return db.users.map((u) => ({
    userId: u.id,
    tenantId: u.tenantId,
    tenantName: db.tenants.find((t) => t.id === u.tenantId)!.name,
    name: u.name,
    roleLabel: roleLabel(u),
    views: viewsFor(u),
    note: ROLE_NOTE[u.id] ?? '',
  }));
}

export function sessionContext(ctx: Ctx): SessionContext {
  const db = ctx.store.db;
  const u = ctx.actor.user;
  const tenant = db.tenants.find((t) => t.id === u.tenantId)!;
  const d = ctx.actor.view === 'admin' ? activeDelegation(db, u.id, ctx.now) : null;
  return {
    tenantId: u.tenantId,
    tenantName: tenant.name,
    userId: u.id,
    userName: u.name,
    view: ctx.actor.view,
    views: viewsFor(u),
    staffRoles: u.staffRoles,
    b2bRoles: u.b2bRoles ?? [],
    businessAccountName: u.businessAccountId ? (db.businessAccounts.find((b) => b.id === u.businessAccountId)?.name ?? null) : null,
    scopes: [...ctx.scopes],
    delegation: d ? { id: d.id, scopes: d.scopes, limit: toMoneyString(d.limit), expiresAt: d.expiresAt, delegatorName: userName(db, d.delegatorId) } : null,
    plan: { kind: tenant.plan.kind, label: tenant.plan.label, expired: db.faults.planExpired },
  };
}

function analyticsFor(ctx: Ctx, businessAccountId?: string | null): AnalyticsResult {
  return computeAnalytics(ctx.store.db, { tenantIds: [ctx.actor.user.tenantId as TenantId], ...DEMO_PERIOD, asOf: ctx.now, businessAccountId });
}

function summaryFrom(a: AnalyticsResult): OwnerSummary {
  const m = (key: string, label: string, amount: number | null, hint: string, sourceIds: string[] = []) => ({ key, label, amount: amount === null ? null : toMoneyString(amount), hint, sourceIds });
  return {
    asOf: a.filter.asOf,
    formulaVersion: a.formulaVersion,
    periodLabel: '22 Sep – 21 Okt 2026 (WIB)',
    money: [
      m('invoice_net', 'Nilai invoice net', a.invoiceNet, 'Invoice terbit dalam periode − kredit. Bukan kas.'),
      m('receipts', 'Penerimaan demo diperiksa', a.netReceipts, 'Receipt posted − reversal − refund. Bukan saldo bank.'),
      m('receivable', 'Piutang', a.receivable, 'Sisa invoice terbit sampai as of.', a.receivableInvoiceIds),
      m('unapplied', 'Belum dialokasikan', a.unapplied, 'Lebih bayar yang menunggu keputusan; bukan dompet.'),
    ],
    contribution: {
      final: toMoneyString(a.contributionFinalTotal),
      coverage: `${a.contributionCoverage.numerator}/${a.contributionCoverage.denominator}`,
      provisionalAliases: a.contributions.filter((c) => c.state === 'provisional').map((c) => c.alias),
    },
    receivableAging: (Object.entries(a.aging) as [keyof typeof a.aging, number][]).filter(([, v]) => v > 0).map(([bucket, amount]) => ({ bucket, amount: toMoneyString(amount) })),
    conversion: a.conversion,
    counts: { requests: a.requestCount, orders: a.orderCount, completed: a.completedOrderIds.length, problematic: a.problematicOrderIds.length },
  };
}

export function ownerSummary(ctx: Ctx): OwnerSummary {
  requireScope(ctx.scopes, 'reports.financial', 'Ringkasan keuangan hanya untuk owner/finance.');
  return summaryFrom(analyticsFor(ctx));
}

export function analyticsReport(ctx: Ctx, businessAccountId: string | null): AnalyticsReport {
  requireScope(ctx.scopes, 'reports.financial', 'Laporan hanya untuk owner/finance.');
  const db = ctx.store.db;
  const a = analyticsFor(ctx, businessAccountId);
  const accounts = [null, ...db.businessAccounts.filter((b) => b.tenantId === ctx.actor.user.tenantId).map((b) => b.id)];
  return {
    ...summaryFrom(a),
    requestsByStatus: Object.entries(a.requestsByStatus).map(([status, ids]) => ({ status: status as never, count: ids.length, ids })).filter((x) => x.count),
    ordersByStatus: Object.entries(a.ordersByStatus).map(([status, ids]) => ({ status: status as never, count: ids!.length, ids: ids! })),
    variance: { actual: toMoneyString(a.variance.actual), estimate: toMoneyString(a.variance.estimate), delta: toMoneyString(a.variance.delta), coverage: `${a.variance.coverage.numerator}/${a.variance.coverage.denominator}` },
    contributions: a.contributions.map((c) => ({ orderId: c.orderId, alias: c.alias, commercialNet: toMoneyString(c.commercialNet), actualDirect: c.actualDirect === null ? null : toMoneyString(c.actualDirect), fee: toMoneyString(c.fee), contribution: c.contribution === null ? null : toMoneyString(c.contribution), state: c.state, reason: c.reason })),
    completeness: [
      { label: 'Biaya final', numerator: a.completeness.costFinal.numerator, denominator: a.completeness.costFinal.denominator },
      { label: 'Bukti lengkap', numerator: a.completeness.evidenceComplete.numerator, denominator: a.completeness.evidenceComplete.denominator },
      { label: 'Sudah diinvoice', numerator: a.completeness.invoiced.numerator, denominator: a.completeness.invoiced.denominator },
    ],
    byAccount: businessAccountId
      ? []
      : accounts.map((accId) => {
          const x = computeAnalytics(db, { tenantIds: [ctx.actor.user.tenantId], ...DEMO_PERIOD, asOf: ctx.now, businessAccountId: accId ?? undefined });
          const personal = accId === null;
          const rows = personal ? x.contributions.filter((c) => !db.requests.find((r) => r.id === db.orders.find((o) => o.id === c.orderId)?.requestId)?.businessAccountId) : x.contributions;
          const finals = rows.filter((c) => c.state === 'final');
          return {
            accountId: accId,
            label: personal ? 'Semua pelanggan (termasuk pribadi)' : (db.businessAccounts.find((b) => b.id === accId)?.name ?? ''),
            orders: x.orderCount,
            invoiceNet: toMoneyString(x.invoiceNet),
            receivable: toMoneyString(x.receivable),
            contribution: finals.length ? toMoneyString(finals.reduce((s, c) => s + c.contribution!, 0)) : null,
            provisional: rows.length - finals.length,
          };
        }),
    receivables: a.receivableInvoiceIds.map((id) => {
      const inv = db.invoices.find((i) => i.id === id)!;
      const b = invoiceBalance(db, id, ctx.now);
      return { invoiceId: id, number: inv.number, alias: db.orders.find((o) => o.id === inv.orderId)?.alias ?? '', payer: inv.payerLabel, outstanding: toMoneyString(b.outstanding), dueDate: inv.dueDate, overdueDays: b.overdueDays };
    }),
  };
}

export function fleet(ctx: Ctx): FleetDTO {
  requireScope(ctx.scopes, 'fleet.view', 'Registry armada untuk owner/admin.');
  const db = ctx.store.db;
  const t = ctx.actor.user.tenantId;
  return {
    units: unitCandidatesForFleet(db, t, ctx.now),
    drivers: db.users
      .filter((u) => u.tenantId === t && (u.staffRoles.includes('driver') || u.staffRoles.includes('partner')))
      .map((u) => {
        const a = db.assignments.find((x) => x.driverId === u.id && (x.status === 'accepted' || x.status === 'offered'));
        return { id: u.id, name: u.name, roles: u.staffRoles, activeAssignment: a ? `${db.orders.find((o) => o.id === a.orderId)?.alias} · ${a.status === 'offered' ? 'ditawarkan' : 'aktif'}` : null };
      }),
    reservations: db.reservations
      .filter((r) => r.status === 'confirmed' && db.orders.find((o) => o.id === r.orderId)?.tenantId === t)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
      .map((r) => ({ id: r.id, orderAlias: db.orders.find((o) => o.id === r.orderId)?.alias ?? '', unitCode: db.units.find((u) => u.id === r.unitId)?.code ?? '', driverName: r.driverId === 'unassigned' ? 'Belum ada petugas' : userName(db, r.driverId), start: r.start, end: r.end, status: r.status })),
  };
}

export function businessAccounts(ctx: Ctx): BusinessAccountDTO[] {
  const db = ctx.store.db;
  const staff = isStaffView(ctx.actor);
  const own = ctx.actor.user.businessAccountId;
  if (!staff && !own) throw new ApiError('FORBIDDEN', 'Hanya untuk pelanggan bisnis dan staf operator.');
  return db.businessAccounts
    .filter((b) => b.tenantId === ctx.actor.user.tenantId && (staff || b.id === own))
    .map((b) => {
      const x = computeAnalytics(db, { tenantIds: [b.tenantId], ...DEMO_PERIOD, asOf: ctx.now, businessAccountId: b.id });
      const finals = x.contributions.filter((c) => c.state === 'final');
      const orders = db.orders.filter((o) => db.requests.find((r) => r.id === o.requestId)?.businessAccountId === b.id);
      return {
        id: b.id,
        alias: b.alias,
        name: b.name,
        poRequired: b.poRequired,
        termsVersion: b.termsVersion,
        netDays: b.netDays,
        rateCards: b.rateCards.map((rc) => ({ id: rc.id, route: rc.route, amount: toMoneyString(rc.amount), validFrom: rc.validFrom, validTo: rc.validTo, valid: Date.parse(rc.validFrom) <= Date.parse(ctx.now) && Date.parse(rc.validTo) > Date.parse(ctx.now) })),
        members: db.users.filter((u) => u.businessAccountId === b.id).map((u) => ({ id: u.id, name: u.name, roles: u.b2bRoles ?? [] })),
        favoriteRoutes: b.favoriteRoutes.map((f) => ({ id: f.id, label: f.label })),
        orders: x.orderCount,
        invoiceNet: toMoneyString(x.invoiceNet),
        receivable: toMoneyString(x.receivable),
        // Kontribusi hanya untuk staf; DTO pelanggan tidak memuat margin (BIZ-08).
        contribution: staff && finals.length ? toMoneyString(finals.reduce((s, c) => s + c.contribution!, 0)) : null,
        provisional: staff ? x.contributions.length - finals.length : 0,
        recentOrders: orders.slice(-5).reverse().map((o) => ({ id: o.id, alias: o.alias, status: o.status, poRef: db.requests.find((r) => r.id === o.requestId)?.poRef ?? null })),
      };
    });
}

export function saas(ctx: Ctx): SaasDTO {
  requireScope(ctx.scopes, 'saas.manage', 'Paket SaaS hanya untuk owner.');
  const db = ctx.store.db;
  const tenant = db.tenants.find((t) => t.id === ctx.actor.user.tenantId)!;
  const usage = db.usage.filter((u) => u.tenantId === tenant.id);
  const billable = usage.filter((u) => u.status === 'billable' || u.status === 'billed_demo');
  const charge = tenant.plan.kind === 'subscription' ? tenant.plan.amount : billable.reduce((s, u) => s + u.amount, 0);
  const change = db.planChanges.find((p) => p.tenantId === tenant.id) ?? null;
  return {
    tenantName: tenant.name,
    plan: { kind: tenant.plan.kind, version: tenant.plan.version, label: tenant.plan.label, amount: toMoneyString(tenant.plan.amount) },
    scheduledChange: change ? { toKind: change.toKind, effectiveFrom: change.effectiveFrom } : null,
    usage: usage.map((u) => ({ id: u.id, alias: db.orders.find((o) => o.id === u.orderId)?.alias ?? '', status: u.status, amount: toMoneyString(u.amount), note: u.note })),
    periodCharge: toMoneyString(charge),
    comparison: [10, 30, 50, 80].map((n) => ({ volume: n, subscription: toMoneyString(500_000), success: toMoneyString(n * 10_000) })),
    invoicePreview: {
      number: `SAAS-DEMO-${tenant.id === 'tenant-a' ? 'A' : 'B'}-2026-10`,
      issuer: 'Solveit Indonesia — PREVIEW DEMO, tidak dapat dibayar',
      lines:
        tenant.plan.kind === 'subscription'
          ? [{ label: `${tenant.plan.label} (${tenant.plan.version})`, amount: toMoneyString(tenant.plan.amount) }]
          : billable.map((u) => ({ label: `Layanan sukses ${db.orders.find((o) => o.id === u.orderId)?.alias}`, amount: toMoneyString(u.amount) })),
      total: toMoneyString(charge),
    },
    expiredFixture: db.faults.planExpired,
  };
}

export function schedulePlanChange(ctx: Ctx, toKind: 'subscription' | 'success'): SaasDTO {
  requireScope(ctx.scopes, 'saas.manage', 'Perubahan paket hanya oleh owner.');
  ctx.store.transact((db) => {
    db.planChanges = db.planChanges.filter((p) => p.tenantId !== ctx.actor.user.tenantId);
    const t = db.tenants.find((x) => x.id === ctx.actor.user.tenantId)!;
    if (t.plan.kind !== toKind) db.planChanges.push({ tenantId: t.id, toKind, effectiveFrom: '2026-11-21T00:00:00.000Z', requestedAt: ctx.now });
  });
  return saas(ctx);
}

const DELEGATION_MAX_HOURS = 8;

export function listDelegations(ctx: Ctx): DelegationDTO[] {
  const db = ctx.store.db;
  const t = Date.parse(ctx.now);
  return db.delegations
    .filter((d) => d.tenantId === ctx.actor.user.tenantId && (ctx.scopes.has('delegation.manage') || d.delegateId === ctx.actor.user.id))
    .slice()
    .reverse()
    .map((d) => ({
      id: d.id,
      delegateId: d.delegateId,
      delegateName: userName(db, d.delegateId),
      scopes: d.scopes,
      limit: toMoneyString(d.limit),
      effectiveAt: d.effectiveAt,
      expiresAt: d.expiresAt,
      reason: d.reason,
      status: d.revokedAt ? 'revoked' : Date.parse(d.expiresAt) <= t ? 'expired' : Date.parse(d.effectiveAt) > t ? 'scheduled' : 'active',
      version: d.version,
    }));
}

export function grantDelegation(ctx: Ctx, input: { delegateId: string; scopes: DelegationScope[]; limit: number; hours: number; reason: string }): DelegationDTO[] {
  requireScope(ctx.scopes, 'delegation.manage', 'Hanya owner yang memberi delegasi; delegasi tidak dapat didelegasikan ulang.');
  if (!input.scopes.length || !input.reason.trim()) throw new ApiError('VALIDATION', 'Pilih izin dan tulis alasan delegasi.');
  if (input.hours <= 0 || input.hours > DELEGATION_MAX_HOURS) throw new ApiError('VALIDATION', `Masa delegasi demo maksimum ${DELEGATION_MAX_HOURS} jam.`);
  if (!Number.isSafeInteger(input.limit) || input.limit < 0) throw new ApiError('VALIDATION', 'Batas nominal harus rupiah bulat.');
  ctx.store.transact((db) => {
    const delegate = db.users.find((u) => u.id === input.delegateId && u.tenantId === ctx.actor.user.tenantId && (u.staffRoles.includes('dispatcher') || u.staffRoles.includes('finance')));
    if (!delegate) throw new ApiError('VALIDATION', 'Penerima delegasi harus admin di tenant yang sama.');
    db.delegations.filter((d) => d.delegateId === delegate.id && !d.revokedAt && Date.parse(d.expiresAt) > Date.parse(ctx.now)).forEach((d) => (d.revokedAt = ctx.now));
    db.delegations.push({ id: `DL-${db.delegations.length + 1}`, tenantId: delegate.tenantId, delegatorId: ctx.actor.user.id, delegateId: delegate.id, scopes: input.scopes, limit: input.limit, effectiveAt: ctx.now, expiresAt: addMinutes(ctx.now, input.hours * 60), reason: input.reason, revokedAt: null, version: 1 });
  });
  return listDelegations(ctx);
}

export function revokeDelegation(ctx: Ctx, id: string): DelegationDTO[] {
  requireScope(ctx.scopes, 'delegation.manage', 'Hanya owner yang mencabut delegasi.');
  ctx.store.transact((db) => {
    const d = db.delegations.find((x) => x.id === id && x.tenantId === ctx.actor.user.tenantId);
    if (!d) throw new ApiError('NOT_FOUND', 'Delegasi tidak ditemukan.');
    d.revokedAt = ctx.now;
    d.version += 1;
  });
  return listDelegations(ctx);
}

export function listSupportGrants(ctx: Ctx): SupportGrantDTO[] {
  requireScope(ctx.scopes, 'support.approve', 'Hanya owner.');
  const t = Date.parse(ctx.now);
  return ctx.store.db.supportGrants
    .filter((g) => g.tenantId === ctx.actor.user.tenantId)
    .slice()
    .reverse()
    .map((g) => ({ id: g.id, actorLabel: g.actorLabel, scopes: g.scopes, reason: g.reason, createdAt: g.createdAt, expiresAt: g.expiresAt, status: g.revokedAt ? 'revoked' : Date.parse(g.expiresAt) <= t ? 'expired' : 'active' }));
}

export function approveSupportGrant(ctx: Ctx, scopes: string[], hours: number, reason: string): SupportGrantDTO[] {
  requireScope(ctx.scopes, 'support.approve', 'Hanya owner yang menyetujui akses dukungan.');
  if (!scopes.length || !reason.trim() || hours <= 0 || hours > 8) throw new ApiError('VALIDATION', 'Pilih cakupan, alasan, dan masa berlaku ≤ 8 jam.');
  ctx.store.transact((db) => {
    db.supportGrants.push({ id: `SG-${db.supportGrants.length + 1}`, tenantId: ctx.actor.user.tenantId, actorLabel: 'Staf dukungan Solveit (ADMIN STUB)', scopes, reason, createdAt: ctx.now, expiresAt: addMinutes(ctx.now, hours * 60), revokedAt: null });
  });
  return listSupportGrants(ctx);
}

export function revokeSupportGrant(ctx: Ctx, id: string): SupportGrantDTO[] {
  requireScope(ctx.scopes, 'support.approve', 'Hanya owner.');
  ctx.store.transact((db) => {
    const g = db.supportGrants.find((x) => x.id === id && x.tenantId === ctx.actor.user.tenantId);
    if (!g) throw new ApiError('NOT_FOUND', 'Grant tidak ditemukan.');
    g.revokedAt = ctx.now;
  });
  return listSupportGrants(ctx);
}

export function inbox(ctx: Ctx): InboxDTO[] {
  return ctx.store.db.inbox
    .filter((i) => i.userId === ctx.actor.user.id)
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((i) => ({ id: i.id, title: i.title, body: i.body, link: i.link, createdAt: i.createdAt, read: i.read }));
}

export function markInboxRead(ctx: Ctx, id: string): InboxDTO[] {
  ctx.store.transact((db) => {
    const i = db.inbox.find((x) => x.id === id && x.userId === ctx.actor.user.id);
    if (i) i.read = true;
  });
  return inbox(ctx);
}

/** RPT-02: CSV dengan metadata cutoff/filter/formula dan escape formula spreadsheet. */
export function exportCsv(ctx: Ctx, template: 'REP-05' | 'REP-06' | 'REP-07', businessAccountId: string | null): ExportResult {
  const db = ctx.store.db;
  if (template === 'REP-07') {
    const own = ctx.actor.user.businessAccountId;
    if (!isStaffView(ctx.actor) && !own) throw new ApiError('FORBIDDEN', 'Rekap layanan B2B untuk organisasi Anda saja.');
    businessAccountId = own ?? businessAccountId;
  } else requireScope(ctx.scopes, 'reports.financial', 'Ekspor keuangan hanya untuk owner/finance.');
  const a = analyticsFor(ctx, businessAccountId);
  const meta = [
    ['DEMO', 'Data sintetis — bukan dokumen pajak/akuntansi'],
    ['template', template],
    ['tenant', db.tenants.find((t) => t.id === ctx.actor.user.tenantId)!.name],
    ['generated_at', ctx.now],
    ['as_of', a.filter.asOf],
    ['timezone', 'Asia/Jakarta'],
    ['period', `[${a.filter.from}, ${a.filter.to})`],
    ['business_account', businessAccountId ?? 'semua'],
    ['formula_version', a.formulaVersion],
    ['dataset_generation', DATASET_GENERATION],
  ];
  let header: string[] = [];
  let rows: (string | number | null)[][] = [];
  if (template === 'REP-05') {
    header = ['order_id', 'completed_at', 'unit', 'business_account', 'commercial_net', 'estimate_D', 'actual_D', 'F', 'variance', 'contribution', 'state', 'reason'];
    rows = a.contributions.map((c) => {
      const o = db.orders.find((x) => x.id === c.orderId)!;
      const req = db.requests.find((r) => r.id === o.requestId)!;
      return [c.orderId, o.handedOverAt, db.units.find((u) => u.id === o.unitId)?.code ?? '', req.businessAccountId ?? '', c.commercialNet, c.estimateDirect, c.actualDirect, c.fee, c.actualDirect === null ? null : c.actualDirect - c.estimateDirect, c.contribution, c.state, c.reason ?? ''];
    });
  } else if (template === 'REP-06') {
    header = ['invoice_id', 'order_id', 'payer', 'issued_at', 'due_date', 'gross', 'credit', 'net', 'allocation', 'outstanding', 'aging_bucket'];
    rows = db.invoices
      .filter((i) => i.tenantId === ctx.actor.user.tenantId && i.status === 'issued')
      .map((i) => {
        const b = invoiceBalance(db, i.id, ctx.now);
        return [i.id, i.orderId, i.payerLabel, i.issuedAt, i.dueDate, b.gross, b.credit, b.net, b.allocated, b.outstanding, b.outstanding === 0 ? 'settled' : b.overdueDays ? (b.overdueDays <= 30 ? '1-30' : '31+') : 'current'];
      });
  } else {
    header = ['business_account', 'order_id', 'route', 'status', 'po_ref', 'invoice_net', 'outstanding', 'evidence'];
    rows = db.orders
      .filter((o) => db.requests.find((r) => r.id === o.requestId)?.businessAccountId === businessAccountId)
      .map((o) => {
        const req = db.requests.find((r) => r.id === o.requestId)!;
        const inv = db.invoices.find((i) => i.orderId === o.id && i.status === 'issued');
        const b = inv ? invoiceBalance(db, inv.id, ctx.now) : null;
        return [businessAccountId, o.id, `${req.pickup.label} → ${req.dropoff.label}`, o.status, req.poRef ?? '', b?.net ?? null, b?.outstanding ?? null, o.evidence];
      });
  }
  const lines = [...meta.map((m) => m.map(csvCell).join(',')), '', header.join(','), ...rows.map((r) => r.map((c) => csvCell(c === null ? '' : String(c))).join(','))];
  return { template, fileName: `tovv-demo-${template.toLowerCase()}-${ctx.now.slice(0, 10)}.csv`, mime: 'text/csv', content: lines.join('\n'), rows: rows.length, generatedAt: ctx.now };
}

export function recentOrdersForAccount(ctx: Ctx, accountId: string) {
  const db = ctx.store.db;
  return db.orders.filter((o) => db.requests.find((r) => r.id === o.requestId)?.businessAccountId === accountId).map((o) => orderSummary(db, o, ctx.now));
}

export const describeNow = (iso: string) => formatDateTime(iso);
export type { ViewGroup };
