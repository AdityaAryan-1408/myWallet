/**
 * MyWallet — Daily Journal Banner (Feature B3: Money Memory)
 * 
 * Displays the day's contextual journal story above transactions:
 * "First day of new job", "Sick day at home", "Weekend trip to Goa"
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Edit3, Sparkles } from 'lucide-react-native';
import { DailyJournal } from '@/db/schema';
import { Colors, FontFamily, Typography } from '@/theme';
import { useFinancialStore } from '@/stores';

interface DailyJournalBannerProps {
  journal: DailyJournal;
  onPress: () => void;
}

export function DailyJournalBanner({ journal, onPress }: DailyJournalBannerProps) {
  const themeMode = useFinancialStore((s) => s.themeMode);
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#F8FAFC' : '#181B26',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(212, 255, 50, 0.25)',
        },
      ]}
      onPress={() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
        onPress();
      }}
      activeOpacity={0.75}
    >
      <View style={styles.leftRow}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emojiText}>{journal.emoji || '✨'}</Text>
        </View>

        <View style={styles.contentCol}>
          <Text style={[styles.eyebrow, { color: isLight ? '#0369A1' : Colors.chartreuse }]}>
            DAILY JOURNAL • CONTEXT
          </Text>
          <Text
            style={[
              styles.noteText,
              { color: isLight ? '#1E293B' : '#F1F5F9' },
            ]}
            numberOfLines={2}
          >
            "{journal.note}"
          </Text>
        </View>
      </View>

      <View style={styles.editIconCircle}>
        <Edit3 size={13} color={isLight ? '#64748B' : '#94A3B8'} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  emojiCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 16,
  },
  contentCol: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 12.5,
    fontFamily: FontFamily.body,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  editIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
