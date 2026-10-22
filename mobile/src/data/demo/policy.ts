import type { DemoDb } from './db';
import type { Delegation, DelegationScope, User, ViewGroup } from '@/domain/types';
import { ApiError } from '@/data/api/contract';

/**
 * Simulasi kebijakan server (ARCHITECTURE §4) agar alur demo menolak tindakan tak berizin dengan
 * cara yang sama seperti API nanti. Ini BUKAN otorisasi produksi: server tetap pemegang otoritas.
 */
export interface Actor {
  user: User;
  view: ViewGroup;
}

export type Scope =
  | 'request.manage'
  | 'request.view_all'
  | 'request.create_own'
  | 'quote.draft'
  | 'quote.send'
  | 'quote.override_within_limit'
  | 'quote.override_any'
  | 'quote.accept_own'
  | 'quote.approve_org'
  | 'assignment.manage'
  | 'assignment.execute'
  | 'expense.submit'
  | 'expense.approve'
  | 'invoice.issue'
  | 'invoice.view_org'
  | 'payment.request'
  | 'payment.verify'
  | 'payment.correct'
  | 'payment.submit_own'
  | 'payment.submit_assisted'
  | 'evidence.capture'
  | 'change.propose'
  | 'change.approve'
  | 'reports.financial'
  | 'fleet.manage'
  | 'fleet.view'
  | 'delegation.manage'
  | 'saas.manage'
  | 'support.approve';

const OWNER: Scope[] = [
  'request.manage', 'request.view_all', 'quote.draft', 'quote.send', 'quote.override_within_limit', 'quote.override_any',
  'assignment.manage', 'expense.approve', 'invoice.issue', 'payment.request', 'payment.verify', 'payment.correct',
  'payment.submit_assisted', 'evidence.capture', 'change.propose', 'reports.financial', 'fleet.manage', 'fleet.view',
  'delegation.manage', 'saas.manage', 'support.approve',
];
const DISPATCHER: Scope[] = ['request.manage', 'request.view_all', 'quote.draft', 'assignment.manage', 'fleet.view', 'payment.submit_assisted', 'change.propose', 'evidence.capture'];
const FINANCE: Scope[] = ['request.view_all', 'invoice.issue', 'payment.request', 'payment.verify', 'payment.correct', 'expense.approve', 'reports.financial', 'payment.submit_assisted'];
const DRIVER: Scope[] = ['assignment.execute', 'expense.submit', 'evidence.capture'];

const DELEGABLE: Record<DelegationScope, Scope> = {
  'quote.send': 'quote.send',
  'quote.override_within_limit': 'quote.override_within_limit',
  'assignment.manage': 'assignment.manage',
  'expense.approve': 'expense.approve',
  'invoice.issue': 'invoice.issue',
  'payment.verify': 'payment.verify',
};

export function viewsFor(user: User): ViewGroup[] {
  const v: ViewGroup[] = [];
  if (user.staffRoles.includes('owner')) v.push('owner');
  if (user.staffRoles.includes('dispatcher') || user.staffRoles.includes('finance')) v.push('admin');
  if (user.staffRoles.includes('driver') || user.staffRoles.includes('partner')) v.push('driver');
  if (user.customerKind) v.push('customer');
  return v;
}

export function activeDelegation(db: DemoDb, userId: string, now: string): Delegation | null {
  const t = Date.parse(now);
  return (
    db.delegations.find(
      (d) => d.delegateId === userId && !d.revokedAt && Date.parse(d.effectiveAt) <= t && Date.parse(d.expiresAt) > t,
    ) ?? null
  );
}

/** Scope efektif untuk konteks tampilan aktif. Owner dalam mode driver hanya memegang scope driver (TEN-07). */
export function scopesFor(db: DemoDb, actor: Actor, now: string): Set<Scope> {
  const s = new Set<Scope>();
  const r = actor.user.staffRoles;
  if (actor.view === 'owner' && r.includes('owner')) OWNER.forEach((x) => s.add(x));
  if (actor.view === 'admin') {
    if (r.includes('dispatcher')) DISPATCHER.forEach((x) => s.add(x));
    if (r.includes('finance')) FINANCE.forEach((x) => s.add(x));
    const d = activeDelegation(db, actor.user.id, now);
    d?.scopes.forEach((x) => s.add(DELEGABLE[x]));
  }
  if (actor.view === 'driver') DRIVER.forEach((x) => s.add(x));
  if (actor.view === 'customer') {
    s.add('request.create_own');
    s.add('payment.submit_own');
    s.add('evidence.capture');
    const b2b = actor.user.b2bRoles ?? [];
    if (!actor.user.businessAccountId) s.add('quote.accept_own');
    if (b2b.includes('approver')) s.add('quote.approve_org');
    if (b2b.includes('finance')) s.add('invoice.view_org');
    if (b2b.includes('approver')) s.add('change.approve');
  }
  return s;
}

export function requireScope(scopes: Set<Scope>, scope: Scope, message: string): void {
  if (!scopes.has(scope)) throw new ApiError('FORBIDDEN', message);
}

/** Customer hanya melihat request miliknya atau organisasinya (BIZ-01). */
export function customerCanSeeRequest(user: User, req: { customerUserId: string | null; businessAccountId: string | null }): boolean {
  if (user.businessAccountId) return req.businessAccountId === user.businessAccountId;
  return req.customerUserId === user.id;
}
