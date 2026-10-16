/**
 * MyWallet — AI Co-Pilot Container
 *
 * Coordinates the floating AiLauncher (semi-circle / full draggable circle)
 * and the 80% AiChatOverlay.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AiLauncher } from './AiLauncher';
import { AiChatOverlay } from './AiChatOverlay';
import { useAiChatStore } from '@/stores/aiChatStore';

export function AiCoPilotContainer() {
  const isChatOpen = useAiChatStore((s) => s.isChatOpen);
  const isAiEnabled = useAiChatStore((s) => s.isAiEnabled);
  const setIsChatOpen = useAiChatStore((s) => s.setIsChatOpen);
  const clearChat = useAiChatStore((s) => s.clearChat);

  if (!isAiEnabled) return null;

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleMinimize = () => {
    setIsChatOpen(false);
  };

  const handleClose = () => {
    setIsChatOpen(false);
    clearChat();
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Floating Launcher (Visible when Chat is closed or minimized) */}
      <AiLauncher onOpen={handleOpenChat} isVisible={!isChatOpen} />

      {/* 80% Height Chat Overlay */}
      <AiChatOverlay
        isOpen={isChatOpen}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />
    </View>
  );
}
