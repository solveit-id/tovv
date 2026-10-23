import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from './txt';
import { HeaderIconButton } from '@/components/layout/app-header';
import { t } from '@/core/i18n';

/**
 * Bottom sheet untuk tugas fokus yang dapat dibatalkan (alasan tolak, kendala, verifikasi).
 * Back Android dan ketuk latar menutup; konten bergulir dan naik bersama keyboard.
 */
export function BottomSheet({ visible, title, onClose, children, footer }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const s = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={s.fill}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Tutup')} />
        <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} pointerEvents="box-none">
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]} accessibilityViewIsModal>
            <View style={s.grabber} />
            <View style={s.head}>
              <Txt variant="headline" accessibilityRole="header" style={{ flex: 1 }}>{title}</Txt>
              <HeaderIconButton icon="close" label="Tutup" onPress={onClose} tone="ink" />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space.md }} style={{ maxHeight: 520 }}>
              {children}
            </ScrollView>
            {footer ? <View style={{ gap: space.sm }}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  fill: { flex: 1 },
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim },
  sheet: { backgroundColor: c.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: space.lg, paddingTop: space.sm },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.lineStrong, marginBottom: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
}));
