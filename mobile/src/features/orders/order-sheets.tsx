import React, { useState } from 'react';
import { View } from 'react-native';
import { space } from '@/core/design/tokens';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField } from '@/components/ui/form';
import { Txt } from '@/components/ui/txt';
import { errorMessage } from '@/data/api/hooks';
import type { Incident } from '@/domain/types';

export type SheetKind =
  | { kind: 'reject' }
  | { kind: 'incident' }
  | { kind: 'exception' }
  | { kind: 'cancel' }
  | { kind: 'abort' }
  | { kind: 'change' }
  | { kind: 'decide'; changeId: string }
  | { kind: 'resolve'; incidentId: string }
  | { kind: 'expense' };

export interface SheetSubmit {
  reject: (reason: string) => Promise<unknown>;
  incident: (type: Incident['type'], note: string) => Promise<unknown>;
  exception: (reason: string) => Promise<unknown>;
  cancel: (reason: string) => Promise<unknown>;
  abort: (info: { location: string; custody: string; pic: string; plan: string }) => Promise<unknown>;
  change: (amount: number, reason: string) => Promise<unknown>;
  decide: (changeId: string, approve: boolean, note: string | null) => Promise<unknown>;
  resolve: (incidentId: string, followUp: string) => Promise<unknown>;
  expense: (category: string, amount: number, note: string) => Promise<unknown>;
}

const INCIDENT_TYPES: { value: Incident['type']; label: string; hint: string }[] = [
  { value: 'receiver_not_ready', label: 'Penerima belum siap', hint: 'Gudang/penerima belum dapat menerima' },
  { value: 'access_blocked', label: 'Akses terhalang', hint: 'Jalan sempit, portal, banjir' },
  { value: 'vehicle_issue', label: 'Masalah kendaraan', hint: 'Kondisi berbeda dari laporan' },
  { value: 'other', label: 'Lainnya', hint: '' },
];

/** Semua lembar input aksi order. Error validasi tampil di lembar, bukan hilang di toast. */
export function OrderSheets(props: { sheet: SheetKind | null; onClose: () => void; submit: SheetSubmit; isStaff: boolean }) {
  if (!props.sheet) return null;
  // key baru per lembar = state form selalu mulai kosong.
  return <SheetBody key={JSON.stringify(props.sheet)} {...props} sheet={props.sheet} />;
}

function SheetBody({ sheet, onClose, submit, isStaff }: { sheet: SheetKind; onClose: () => void; submit: SheetSubmit; isStaff: boolean }) {
  const [text, setText] = useState('');
  const [text2, setText2] = useState('');
  const [text3, setText3] = useState('');
  const [text4, setText4] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [itype, setIType] = useState<Incident['type']>('receiver_not_ready');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      onClose();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const errorLine = err ? (
    <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite" style={{ marginBottom: space.sm }}>{err}</Txt>
  ) : null;

  const k = sheet.kind;
  const titles: Record<SheetKind['kind'], string> = {
    reject: 'Tolak tugas',
    incident: 'Laporkan kendala',
    exception: 'Mulai memuat tanpa 2 foto',
    cancel: 'Batalkan order',
    abort: 'Hentikan setelah loading (abort)',
    change: 'Ajukan biaya tambahan',
    decide: 'Keputusan biaya tambahan',
    resolve: 'Tindak lanjut kendala',
    expense: 'Catat biaya',
  };

  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;
  if (k === 'reject' || k === 'exception' || k === 'cancel') {
    body = (
      <Field
        label={k === 'exception' ? 'Alasan pengecualian foto' : 'Alasan'}
        value={text}
        onChangeText={setText}
        multiline
        helper={k === 'reject' ? 'Admin memakai alasan ini untuk mencari pengganti.' : k === 'cancel' ? 'Pembatalan hanya sebelum loading; reservasi unit dilepas.' : 'Contoh: hujan deras, foto menyusul di tempat teduh. Tercatat pada riwayat.'}
      />
    );
    footer = <Button label={k === 'cancel' ? 'Batalkan order' : k === 'reject' ? 'Kirim penolakan' : 'Lanjut memuat'} variant={k === 'exception' ? 'primary' : 'danger'} loading={busy} onPress={() => void run(() => (k === 'reject' ? submit.reject(text) : k === 'cancel' ? submit.cancel(text) : submit.exception(text)))} />;
  }
  if (k === 'incident') {
    body = (
      <>
        <Choice label="Jenis kendala" options={INCIDENT_TYPES} value={itype} onChange={setIType} />
        <Field label="Keterangan singkat" value={text} onChangeText={setText} multiline helper="Isi saat kendaraan berhenti. Status perjalanan tidak berubah otomatis." />
      </>
    );
    footer = <Button label="Kirim ke admin" loading={busy} onPress={() => void run(() => submit.incident(itype, text))} />;
  }
  if (k === 'abort') {
    body = (
      <>
        <Field label="Lokasi saat ini" value={text} onChangeText={setText} />
        <Field label="Penguasaan kendaraan" value={text2} onChangeText={setText2} helper="Di mana kendaraan pelanggan sekarang dan siapa yang memegangnya." />
        <Field label="PIC" value={text3} onChangeText={setText3} />
        <Field label="Rencana penyelesaian" value={text4} onChangeText={setText4} multiline />
      </>
    );
    footer = <Button label="Catat penghentian" variant="danger" loading={busy} onPress={() => void run(() => submit.abort({ location: text, custody: text2, pic: text3, plan: text4 }))} />;
  }
  if (k === 'change') {
    body = (
      <>
        <MoneyField label="Nominal" value={amount} onChange={setAmount} />
        <Field label="Alasan" value={text} onChangeText={setText} multiline helper="Ditagih hanya setelah pelanggan/approver menyetujui." />
      </>
    );
    footer = <Button label="Ajukan ke pelanggan" loading={busy} onPress={() => void run(() => submit.change(amount ?? 0, text))} />;
  }
  if (k === 'decide') {
    body = (
      <>
        <Txt variant="bodySm" tone="inkSecondary" style={{ marginBottom: space.md }}>
          Biaya tambahan baru masuk tagihan setelah disetujui. Menolak tidak mengubah invoice secara diam-diam.
        </Txt>
        {isStaff ? <Field label="Pernyataan pelanggan (kanal, waktu)" value={text} onChangeText={setText} multiline /> : null}
      </>
    );
    footer = (
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label="Tolak" variant="danger" style={{ flex: 1 }} loading={busy} onPress={() => void run(() => submit.decide(sheet.changeId, false, isStaff ? text : null))} />
        <Button label="Setujui" style={{ flex: 1 }} loading={busy} onPress={() => void run(() => submit.decide(sheet.changeId, true, isStaff ? text : null))} />
      </View>
    );
  }
  if (k === 'resolve') {
    body = <Field label="Tindak lanjut" value={text} onChangeText={setText} multiline helper="Menutup kendala tidak memajukan tahap perjalanan." />;
    footer = <Button label="Tutup kendala" loading={busy} onPress={() => void run(() => submit.resolve(sheet.incidentId, text))} />;
  }
  if (k === 'expense') {
    body = (
      <>
        <Field label="Kategori" value={text} onChangeText={setText} placeholder="mis. Tol, BBM, parkir" />
        <MoneyField label="Nominal" value={amount} onChange={setAmount} />
        <Field label="Catatan / nomor nota" value={text2} onChangeText={setText2} />
      </>
    );
    footer = <Button label="Simpan biaya" loading={busy} onPress={() => void run(() => submit.expense(text, amount ?? 0, text2))} />;
  }

  return (
    <BottomSheet visible title={titles[k]} onClose={onClose} footer={<>{errorLine}{footer}</>}>
      {body}
    </BottomSheet>
  );
}
