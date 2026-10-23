import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View, type KeyboardTypeOptions, type LayoutChangeEvent, type TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { radius, space, touch, type } from '@/core/design/tokens';
import { makeStyles, useColors, useTheme } from '@/core/design/theme';
import { glideSpring, useReducedMotion } from '@/core/design/motion';
import { formatInputRupiah, parseRupiahInput } from '@/core/format/money';
import { tr, useLocale } from '@/core/i18n';
import { Txt } from './txt';
import { Icon } from './icon';

export interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string | null;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  prefix?: string;
  suffix?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  testID?: string;
  /** Kata sandi: teks disamarkan dengan tombol tampil/sembunyi. */
  secure?: boolean;
  icon?: string;
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  returnKeyType?: React.ComponentProps<typeof TextInput>['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: React.Ref<TextInputInstance>;
}

/** Kolom isian: label di atas, kotak membulat; fokus = garis biru 2 dp yang menyala halus. */
export function Field({ label, value, onChangeText, placeholder, helper, error, multiline, keyboardType, prefix, suffix, autoCapitalize = 'sentences', editable = true, testID, secure, icon, autoComplete, returnKeyType, onSubmitEditing, inputRef }: FieldProps) {
  const { c, scheme } = useTheme();
  const s = useStyles();
  useLocale();
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={s.field}>
      <Txt variant="label" tone="inkSecondary" nativeID={`${testID ?? label}-label`}>{label}</Txt>
      <View style={[s.inputBox, focus && s.focus, !!error && s.errorBox, !editable && s.readonly, multiline && { alignItems: 'flex-start' }]}>
        {icon ? <Icon name={icon} size={20} tone={focus ? 'accentInk' : 'inkMuted'} /> : null}
        {prefix ? <Txt variant="bodyStrong" tone="inkSecondary">{prefix}</Txt> : null}
        <TextInput
          ref={inputRef}
          testID={testID}
          accessibilityLabel={tr(label)}
          accessibilityHint={helper ? tr(helper) : undefined}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ? tr(placeholder) : undefined}
          secureTextEntry={secure && hidden}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={secure || keyboardType === 'email-address' ? false : undefined}
          placeholderTextColor={c.inkMuted}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          selectionColor={c.accent}
          cursorColor={c.accent}
          keyboardAppearance={scheme}
          style={[s.input, multiline && s.multiline, (keyboardType === 'number-pad' || keyboardType === 'numeric') && { fontVariant: ['tabular-nums'] }]}
        />
        {suffix ? <Txt variant="body" tone="inkSecondary">{suffix}</Txt> : null}
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr(hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi')}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} tone="inkSecondary" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={s.msg} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={15} tone="dangerInk" />
          <Txt variant="caption" tone="dangerInk" style={{ flex: 1 }}>{error}</Txt>
        </View>
      ) : helper ? (
        <Txt variant="caption" tone="inkSecondary">{helper}</Txt>
      ) : null}
    </View>
  );
}

/** Input rupiah: hanya digit, dikelompokkan titik, nilai kosong = null (bukan nol). */
export function MoneyField({ value, onChange, ...rest }: Omit<FieldProps, 'value' | 'onChangeText' | 'keyboardType' | 'prefix'> & { value: number | null; onChange: (v: number | null) => void }) {
  return <Field {...rest} prefix="Rp" keyboardType="number-pad" value={formatInputRupiah(value)} onChangeText={(t) => onChange(parseRupiahInput(t))} />;
}

/** Pilihan tunggal sebagai kartu radio. `hideLabel` bila grup sudah diberi SectionTitle; label tetap dibacakan. */
export function Choice<T extends string>({ label, options, value, onChange, helper, hideLabel }: { label: string; options: { value: T; label: string; hint?: string }[]; value: T; onChange: (v: T) => void; helper?: string; hideLabel?: boolean }) {
  const s = useStyles();
  return (
    <View style={s.field} accessibilityRole="radiogroup" accessibilityLabel={tr(label)}>
      {hideLabel ? null : <Txt variant="label" tone="inkSecondary">{label}</Txt>}
      <View style={s.choices}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.hint ? `${tr(o.label)}. ${tr(o.hint)}` : tr(o.label)}
              style={({ pressed }) => [s.choice, on && s.choiceOn, pressed && !on && s.choicePressed]}
            >
              <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
              <View style={{ flexShrink: 1, flex: 1 }}>
                <Txt variant="bodyStrong" tone={on ? 'accentInk' : 'ink'}>{o.label}</Txt>
                {o.hint ? <Txt variant="caption" tone="inkSecondary">{o.hint}</Txt> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      {helper ? <Txt variant="caption" tone="inkSecondary">{helper}</Txt> : null}
    </View>
  );
}

export function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const c = useColors();
  const s = useStyles();
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={tr(label)} accessibilityHint={hint ? tr(hint) : undefined} style={s.toggle}>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{label}</Txt>
        {hint ? <Txt variant="caption" tone="inkSecondary">{hint}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.accent, false: c.lineStrong }} thumbColor="#FFFFFF" ios_backgroundColor={c.lineStrong} importantForAccessibility="no-hide-descendants" />
    </Pressable>
  );
}

/**
 * Kontrol segmen untuk menyaring daftar (bukan navigasi). Pil putih meluncur ke segmen aktif
 * dengan pegas di UI thread; tanpa gerak saat "kurangi gerakan".
 */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useSharedValue(0);
  const seg = w > 0 ? (w - 6) / options.length : 0;
  useEffect(() => {
    x.value = reduced ? idx * seg : withSpring(idx * seg, glideSpring);
  }, [idx, seg, reduced, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: seg, opacity: withTiming(seg > 0 ? 1 : 0) }));
  return (
    <View style={s.segWrap} accessibilityRole="tablist" onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      <Animated.View style={[s.segPill, pill]} pointerEvents="none" />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.count !== undefined ? `${o.label}, ${o.count}` : o.label}
            style={s.segItem}
          >
            <Txt variant="bodySm" tone={on ? 'ink' : 'inkSecondary'} style={{ fontWeight: on ? '700' : '500' }} numberOfLines={1}>
              {o.label}
              {o.count !== undefined ? <Txt variant="bodySm" tone={on ? 'accentInk' : 'inkMuted'} bold>{`  ${o.count}`}</Txt> : null}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Baris chip filter yang dapat digeser (mis. pilih pelanggan bisnis). Satu pilihan aktif. */
export function ChipRow<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const s = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" accessibilityLabel={tr(label)} contentContainerStyle={s.chips} style={s.chipScroll}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [s.chip, on && s.chipOn, pressed && !on && s.choicePressed]}>
            {on ? <Icon name="check" size={16} tone="onAccent" /> : null}
            <Txt variant="bodySm" tone={on ? 'onAccent' : 'ink'} style={{ fontWeight: '600' }} numberOfLines={1}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  chipScroll: { marginHorizontal: -space.lg, marginBottom: space.md },
  chips: { gap: space.sm, paddingHorizontal: space.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: space.md + 2, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface },
  chipOn: { backgroundColor: c.accent, borderColor: c.accent },
  field: { gap: space.xs + 2, marginBottom: space.lg },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: c.line,
    borderRadius: radius.md,
    paddingHorizontal: space.md + 2,
    backgroundColor: c.surface,
  },
  focus: { borderColor: c.accent, borderWidth: 2, backgroundColor: c.surface },
  errorBox: { borderColor: c.dangerInk, backgroundColor: c.dangerWash },
  readonly: { backgroundColor: c.surfaceAlt, borderColor: c.surfaceAlt },
  input: { flex: 1, ...(type.body as object), color: c.ink, paddingVertical: space.sm },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: space.md },
  msg: { flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  choices: { gap: space.sm },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingHorizontal: space.md + 2, paddingVertical: space.sm, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.surface },
  choiceOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
  choicePressed: { backgroundColor: c.surfacePressed },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: c.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch.min, paddingVertical: space.sm },
  segWrap: { flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: radius.pill, padding: 3, marginBottom: space.md },
  segPill: { position: 'absolute', top: 3, bottom: 3, left: 3, borderRadius: radius.pill, backgroundColor: scheme === 'dark' ? c.accentSoft : c.surface, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: scheme === 'dark' ? c.accent : c.line },
  segItem: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
}));
