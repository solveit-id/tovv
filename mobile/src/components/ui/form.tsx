import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { color, radius, space, touch, type } from '@/core/design/tokens';
import { formatInputRupiah, parseRupiahInput } from '@/core/format/money';
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
}

export function Field({ label, value, onChangeText, placeholder, helper, error, multiline, keyboardType, prefix, suffix, autoCapitalize = 'sentences', editable = true, testID }: FieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={styles.field}>
      <Txt variant="label" tone="inkSecondary" nativeID={`${testID ?? label}-label`}>{label}</Txt>
      <View style={[styles.inputBox, focus && styles.focus, !!error && styles.errorBox, !editable && styles.readonly, multiline && { alignItems: 'flex-start' }]}>
        {prefix ? <Txt variant="body" tone="inkSecondary">{prefix}</Txt> : null}
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={helper}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={color.inkSecondary}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          selectionColor={color.carbon}
          cursorColor={color.carbon}
          style={[styles.input, multiline && styles.multiline, (keyboardType === 'number-pad' || keyboardType === 'numeric') && { fontVariant: ['tabular-nums'] }]}
        />
        {suffix ? <Txt variant="body" tone="inkSecondary">{suffix}</Txt> : null}
      </View>
      {error ? (
        <View style={styles.msg} accessibilityLiveRegion="polite">
          <Icon name="alert-circle-outline" size={14} tone="dangerInk" />
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

/** `hideLabel` bila grup sudah diberi SectionTitle; label tetap dibacakan pembaca layar. */
export function Choice<T extends string>({ label, options, value, onChange, helper, hideLabel }: { label: string; options: { value: T; label: string; hint?: string }[]; value: T; onChange: (v: T) => void; helper?: string; hideLabel?: boolean }) {
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {hideLabel ? null : <Txt variant="label" tone="inkSecondary">{label}</Txt>}
      <View style={styles.choices}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.hint ? `${o.label}. ${o.hint}` : o.label}
              style={({ pressed }) => [styles.choice, on && styles.choiceOn, pressed && { opacity: 0.85 }]}
            >
              <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={18} tone={on ? 'carbon' : 'inkSecondary'} />
              <View style={{ flexShrink: 1 }}>
                <Txt variant="bodySm" tone={on ? 'carbon' : 'ink'} style={{ fontWeight: on ? '700' : '500' }}>{o.label}</Txt>
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
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} accessibilityHint={hint} style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Txt variant="body">{label}</Txt>
        {hint ? <Txt variant="caption" tone="inkSecondary">{hint}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: color.carbon, false: color.ruleStrong }} thumbColor={color.sheet} importantForAccessibility="no-hide-descendants" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs, marginBottom: space.lg },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touch.min,
    borderWidth: 1.5,
    borderColor: color.ruleStrong,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    backgroundColor: color.sheet,
  },
  focus: { borderColor: color.carbon, borderWidth: 2 },
  errorBox: { borderColor: color.dangerInk },
  readonly: { backgroundColor: color.sheetSunk },
  input: { flex: 1, ...(type.body as object), color: color.ink, paddingVertical: space.sm },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  msg: { flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  choices: { gap: space.xs },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: touch.min, paddingHorizontal: space.md, paddingVertical: space.sm, borderWidth: 1.5, borderColor: color.rule, borderRadius: radius.control, backgroundColor: color.sheet },
  choiceOn: { borderColor: color.carbon, backgroundColor: color.carbonTint },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch.min, paddingVertical: space.sm },
});

/** Kontrol segmen untuk menyaring daftar (bukan navigasi). */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <View style={segStyles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.count !== undefined ? `${o.label}, ${o.count}` : o.label}
            style={[segStyles.item, on && segStyles.on]}
          >
            <Txt variant="bodySm" tone={on ? 'onNavy' : 'ink'} style={{ fontWeight: '600' }} numberOfLines={1}>
              {o.label}
              {o.count !== undefined ? ` ${o.count}` : ''}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: color.sheetSunk, borderRadius: radius.control, padding: 3, gap: 3, marginBottom: space.md },
  item: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control - 2, paddingHorizontal: space.sm },
  on: { backgroundColor: color.navy },
});
