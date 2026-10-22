import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusTag } from './status-tag';
import { Money } from './surface';
import { proofStatus, quoteStatus } from '@/core/i18n/status';
import { formatRupiah } from '@/core/format/money';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('komponen dasar', () => {
  it('status tidak bergantung warna: label aksesibilitas menyebut status dan bentuk garis', async () => {
    await render(<StatusTag look={proofStatus.pending_review} />);
    expect(screen.getByLabelText('Status: Menunggu pemeriksaan, belum final')).toBeTruthy();
    await render(<StatusTag look={quoteStatus.superseded} />);
    expect(screen.getByLabelText('Status: Diganti versi baru, tidak berlaku')).toBeTruthy();
  });

  it('nilai uang yang belum diketahui ditulis "—" dengan keterangan, bukan Rp 0', async () => {
    await render(<Money value={null} missingLabel="belum final" />);
    expect(screen.getByLabelText('Nilai belum final')).toBeTruthy();
    expect(screen.queryByText('Rp 0')).toBeNull();
  });

  it('format rupiah memakai titik ribuan dan menolak pecahan', () => {
    expect(formatRupiah('3214000')).toBe('Rp 3.214.000');
    expect(formatRupiah(-200_000)).toBe('−Rp 200.000');
    expect(() => formatRupiah(10.5)).toThrow();
  });
});
