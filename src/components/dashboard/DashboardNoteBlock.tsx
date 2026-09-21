/**
 * MyWallet — Dashboard Scratchpad Note Block
 * 
 * Phase 3.8 Deliverable:
 * - Placed immediately below the Category Burn Donut Chart
 * - Free-form text scratchpad with auto-wrapping (no horizontal scrolling)
 * - Dynamically auto-sizes to text content up to max height (180dp) with vertical scrolling beyond
 * - Minimizable / collapsible with chevron toggle
 * - Voice memo recording & playback via expo-av
 * - Real-time SQLite persistence via NoteRepository
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { NoteRepository } from '@/repositories';

const MAX_NOTE_HEIGHT = 180;

export function DashboardNoteBlock() {
  const [content, setContent] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const timerRef = useRef<any>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Audio recorder via expo-audio (SDK 57 native module)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Audio player via expo-audio
  const player = useAudioPlayer(voiceUri ? { uri: voiceUri } : null);
  const playerStatus = useAudioPlayerStatus(player);
  const isPlaying = Boolean(playerStatus.playing);

  // Load saved note on mount
  useEffect(() => {
    try {
      const savedNote = NoteRepository.getActiveNote();
      setContent(savedNote.content || '');
      setIsMinimized(Boolean(savedNote.is_minimized));
      setVoiceUri(savedNote.voice_uri || null);
    } catch (e) {
      console.warn('Could not load dashboard note:', e);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Debounced auto-save for text content
  const handleContentChange = (text: string) => {
    setContent(text);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      NoteRepository.saveContent(text);
    }, 400);
  };

  // Toggle collapse / minimize
  const toggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    NoteRepository.setMinimized(nextState);
  };

  // ─── Voice Recording Handlers ─────────────────────────────────────

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record voice notes.');
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not access audio recorder on this device.');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recorder.stop();
      setIsRecording(false);

      const uri = recorder.uri;
      if (uri) {
        setVoiceUri(uri);
        NoteRepository.saveVoiceUri(uri);
      }
    } catch (error) {
      console.warn('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  // ─── Voice Playback Handlers ──────────────────────────────────────

  const playSound = async () => {
    if (!voiceUri) return;

    try {
      if (playerStatus.currentTime >= playerStatus.duration && playerStatus.duration > 0) {
        await player.seekTo(0);
      }
      player.play();
    } catch (e) {
      console.warn('Playback error:', e);
    }
  };

  const pauseSound = () => {
    try {
      player.pause();
    } catch (e) {
      console.warn('Pause error:', e);
    }
  };

  const deleteVoiceNote = () => {
    try {
      player.pause();
    } catch {}
    setVoiceUri(null);
    NoteRepository.saveVoiceUri(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      {/* ─── Header Bar ─── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <FileText size={15} color={Colors.primaryFixed} />
          </View>
          <Text style={styles.title}>Scratchpad / Quick Notes</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Audio recording trigger / status */}
          {!isRecording ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={startRecording}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Mic size={16} color={voiceUri ? Colors.primaryFixed : Colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.recordingActiveBtn]}
              onPress={stopRecording}
              activeOpacity={0.7}
            >
              <Square size={13} color="#FFFFFF" />
              <Text style={styles.recordingText}>{formatTimer(recordDuration)}</Text>
            </TouchableOpacity>
          )}

          {/* Minimize / Expand chevron */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={toggleMinimize}
            activeOpacity={0.7}
          >
            {isMinimized ? (
              <ChevronDown size={18} color={Colors.onSurfaceVariant} />
            ) : (
              <ChevronUp size={18} color={Colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Collapsed Single-line Preview ─── */}
      {isMinimized && (
        <TouchableOpacity
          style={styles.collapsedPreview}
          onPress={toggleMinimize}
          activeOpacity={0.8}
        >
          <Text style={styles.collapsedText} numberOfLines={1}>
            {content.trim()
              ? content.replace(/\n/g, ' ')
              : voiceUri
              ? '🎙️ Voice note recorded • Tap to expand'
              : 'Tap to write notes or record audio...'}
          </Text>
          {voiceUri && (
            <View style={styles.voiceBadge}>
              <Volume2 size={12} color={Colors.primaryFixed} />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* ─── Expanded Content ─── */}
      {!isMinimized && (
        <View style={styles.body}>
          {/* Multiline auto-wrapping text area */}
          <TextInput
            style={[styles.input, { maxHeight: MAX_NOTE_HEIGHT }]}
            value={content}
            onChangeText={handleContentChange}
            placeholder="Write reminders, rough math, or cash spent here..."
            placeholderTextColor={Colors.onSurfaceVariant}
            multiline={true}
            scrollEnabled={true}
            textAlignVertical="top"
          />

          {/* Voice Memo Player Strip (if recorded) */}
          {voiceUri && !isRecording && (
            <View style={styles.voicePlayerStrip}>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={isPlaying ? pauseSound : playSound}
                activeOpacity={0.7}
              >
                {isPlaying ? (
                  <Pause size={14} color={Colors.surface} />
                ) : (
                  <Play size={14} color={Colors.surface} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>

              <View style={styles.voiceInfo}>
                <Text style={styles.voiceTitle}>Voice Note</Text>
                <Text style={styles.voiceSub}>
                  {isPlaying ? 'Playing back...' : 'Tap to listen'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteVoiceBtn}
                onPress={deleteVoiceNote}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color={Colors.expense} />
              </TouchableOpacity>
            </View>
          )}

          {/* Footer status */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {content.length > 0 ? `${content.length} characters` : 'Auto-saves to local SQLite'}
            </Text>
            {voiceUri && (
              <Text style={[styles.footerText, { color: Colors.primaryFixed }]}>
                • 1 Audio memo attached
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    overflow: 'hidden',
    ...Elevation.low,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 6,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.expense,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    gap: 4,
  },
  recordingText: {
    ...Typography.bodySmMedium,
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.numeric,
  },
  collapsedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  collapsedText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
  },
  voiceBadge: {
    marginLeft: 8,
    padding: 3,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  body: {
    padding: Spacing.md,
  },
  input: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 54,
    paddingTop: 0,
    paddingBottom: Spacing.xs,
    paddingHorizontal: 0,
  },
  voicePlayerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 10,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  voiceSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  deleteVoiceBtn: {
    padding: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  footerText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
});
