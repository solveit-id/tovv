import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space } from '@/core/design/tokens';
import { Txt } from './txt';
import { HeaderIconButton } from '@/components/layout/app-header';

/**
 * Bottom sheet untuk tugas fokus yang dapat dibatalkan (alasan tolak, kendala, verifikasi).
 * Back Android dan ketuk latar menutup; konten bergulir dan naik bersama keyboard.
 */
export function BottomSheet({ visible, title, onClose, children, footer }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" />
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} pointerEvents="box-none">
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]} accessibilityViewIsModal>
            <View style={styles.grabber} />
            <View style={styles.head}>
              <Txt variant="headline" accessibilityRole="header" style={{ flex: 1 }}>{title}</Txt>
              <HeaderIconButton icon="close" label="Tutup" onPress={onClose} onDark={false} />
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.scrim },
  sheet: { backgroundColor: color.ground, borderTopLeftRadius: radius.sheet * 2, borderTopRightRadius: radius.sheet * 2, paddingHorizontal: space.lg, paddingTop: space.sm },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.ruleStrong, marginBottom: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
});
