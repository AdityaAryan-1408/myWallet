/**
 * MyWallet — Daily Journal Modal (Feature B3: Money Memory)
 * 
 * Interactive bottom sheet / modal for annotating any date with:
 * - A mood / vibe emoji (Celebration, Work, Trip, Sick, Chill, etc.)
 * - A custom one-line story/journal entry ("First day of new job", "Sick day at home")
 * - Save and delete actions connected to SQLite
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check, Trash2, BookOpen, Sparkles } from 'lucide-react-native';
import { Colors, FontFamily, Typography } from '@/theme';
import { DailyJournalRepository } from '@/repositories/dailyJournalRepository';
import { useFinancialStore } from '@/stores';

const QUICK_MOODS = [
  { emoji: '✨', label: 'Special' },
  { emoji: '💼', label: 'Work' },
  { emoji: '🎉', label: 'Celebration' },
  { emoji: '🚗', label: 'Trip' },
  { emoji: '🤒', label: 'Sick' },
  { emoji: '🏠', label: 'Home' },
  { emoji: '🛍️', label: 'Shopping' },
  { emoji: '🍕', label: 'Foodie' },
  { emoji: '☕', label: 'Chill' },
  { emoji: '🏋️', label: 'Fitness' },
];

interface DailyJournalModalProps {
  visible: boolean;
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onSaved: () => void;
}

export function DailyJournalModal({ visible, date, onClose, onSaved }: DailyJournalModalProps) {
  const themeMode = useFinancialStore((s) => s.themeMode);
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  const [note, setNote] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('✨');
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    if (visible && date) {
      const existing = DailyJournalRepository.getByDate(date);
      if (existing) {
        setNote(existing.note || '');
        setSelectedEmoji(existing.emoji || '✨');
        setIsExisting(true);
      } else {
        setNote('');
        setSelectedEmoji('✨');
        setIsExisting(false);
      }
    }
  }, [visible, date]);

  // Format date for header
  let formattedDate = date;
  try {
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {}

  const handleSave = () => {
    if (!note.trim()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    DailyJournalRepository.save(date, note.trim(), selectedEmoji);
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    DailyJournalRepository.delete(date);
    onSaved();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isLight ? '#FFFFFF' : '#161922',
              borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <BookOpen size={16} color={Colors.chartreuse} />
              </View>
              <View>
                <Text style={[styles.title, { color: isLight ? '#0F172A' : '#F8FAFC' }]}>
                  Money Memory Journal
                </Text>
                <Text style={styles.subtitle}>{formattedDate}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isLight ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Mood / Vibe Selector */}
          <Text style={[styles.sectionLabel, { color: isLight ? '#475569' : '#94A3B8' }]}>
            DAY VIBE / THEME
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodRow}
          >
            {QUICK_MOODS.map((m) => {
              const isSelected = selectedEmoji === m.emoji;
              return (
                <TouchableOpacity
                  key={m.label}
                  style={[
                    styles.moodChip,
                    isSelected && styles.moodChipSelected,
                    {
                      backgroundColor: isSelected
                        ? (isLight ? '#E0F2FE' : 'rgba(212, 255, 50, 0.15)')
                        : (isLight ? '#F1F5F9' : '#222533'),
                      borderColor: isSelected
                        ? (isLight ? '#0284C7' : Colors.chartreuse)
                        : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedEmoji(m.emoji);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      {
                        color: isSelected
                          ? (isLight ? '#0284C7' : Colors.chartreuse)
                          : (isLight ? '#64748B' : '#94A3B8'),
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Story Input */}
          <Text style={[styles.sectionLabel, { color: isLight ? '#475569' : '#94A3B8' }]}>
            WHAT HAPPENED TODAY? (ONE-LINE CONTEXT)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isLight ? '#F8FAFC' : '#1E212D',
                color: isLight ? '#0F172A' : '#F8FAFC',
                borderColor: isLight ? '#E2E8F0' : '#2D3245',
              },
            ]}
            placeholder="e.g. First day of new job, Sick day at home, Roadtrip..."
            placeholderTextColor={isLight ? '#94A3B8' : '#64748B'}
            value={note}
            onChangeText={setNote}
            maxLength={120}
            multiline
            numberOfLines={2}
          />

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            {isExisting && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { opacity: note.trim().length > 0 ? 1 : 0.5 },
              ]}
              onPress={handleSave}
              disabled={note.trim().length === 0}
              activeOpacity={0.8}
            >
              <Check size={16} color="#000000" />
              <Text style={styles.saveBtnText}>Save Memory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.heading,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.mono,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  moodChipSelected: {
    borderWidth: 1.5,
  },
  moodEmoji: {
    fontSize: 14,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: FontFamily.body,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: FontFamily.body,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    marginRight: 'auto',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: FontFamily.body,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.chartreuse,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 13.5,
    fontFamily: FontFamily.body,
    fontWeight: '700',
  },
});
