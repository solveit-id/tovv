import React from 'react';
import { Pressable, View } from 'react-native';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { ServiceArt } from '@/components/brand/service-art';
import type { ServicePackageDTO } from '@/data/api/contract';
import type { ServiceKind } from '@/domain/types';
import { formatRupiah } from '@/core/format/money';
import { t, tr } from '@/core/i18n';

/** Pilihan paket layanan 2 kolom di formulir: gambar, nama, harga mulai; yang terpilih bergaris biru bercentang. */
export function ServicePicker({ packages, value, onChange }: { packages: ServicePackageDTO[]; value: ServiceKind; onChange: (k: ServiceKind) => void }) {
  const s = useStyles();
  return (
    <View style={s.grid} accessibilityRole="radiogroup" accessibilityLabel={tr('Paket layanan')}>
      {packages.map((p) => {
        const on = p.kind === value;
        return (
          <Pressable
            key={p.kind}
            onPress={() => onChange(p.kind)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={t('{0}. {1}', [p.name, tr(p.tagline)])}
            style={({ pressed }) => [s.tile, on && s.tileOn, pressed && !on && s.pressed]}
          >
            <View style={s.art} pointerEvents="none">
              <ServiceArt kind={p.kind} width={112} />
            </View>
            <Txt variant="bodySm" bold numberOfLines={2}>{p.name}</Txt>
            <Txt variant="caption" tone="inkSecondary">{t('Mulai {0}', [formatRupiah(p.startFrom)])}</Txt>
            {on ? (
              <View style={s.check}>
                <Icon name="check" size={14} tone="onAccent" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  tile: { flexBasis: '47%', flexGrow: 1, padding: space.sm + 2, gap: 1, borderRadius: radius.lg, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface },
  tileOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
  pressed: { backgroundColor: c.surfacePressed },
  art: { height: 52, justifyContent: 'flex-end', marginBottom: 4, marginLeft: -4 },
  check: { position: 'absolute', top: space.sm, right: space.sm, width: 22, height: 22, borderRadius: 11, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
}));
