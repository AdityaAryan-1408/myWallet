/**
 * MyWallet — Milestones & Achievements Modal (Feature B6)
 * 
 * Elegant showcase displaying:
 * - Current and longest daily logging streaks
 * - Visual badges collection (Streak, Budget Guardian, Goal Milestones, Zen Spender)
 * - Real-time progress bars towards next unlocks
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Flame, Trophy, Lock, CheckCircle2, Award, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { StreaksService, StreaksSummary, Achievement } from '@/services/streaksService';
import { Colors, FontFamily, Typography } from '@/theme';
import { useFinancialStore } from '@/stores';

interface MilestonesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MilestonesModal({ visible, onClose }: MilestonesModalProps) {
  const themeMode = useFinancialStore((s) => s.themeMode);
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  const summary = useMemo<StreaksSummary>(() => {
    if (!visible) {
      return {
        currentStreakDays: 0,
        longestStreakDays: 0,
        totalTransactionsLogged: 0,
        monthsUnderBudget: 0,
        unlockedCount: 0,
        totalCount: 0,
        achievements: [],
      };
    }
    return StreaksService.getStreaksSummary();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.container,
            {
              backgroundColor: isLight ? '#FFFFFF' : '#14161F',
              borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.trophyIconWrap}>
                <Trophy size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isLight ? '#0F172A' : '#F8FAFC' }]}>
                  Milestones & Streaks
                </Text>
                <Text style={styles.headerSubtitle}>
                  {summary.unlockedCount} of {summary.totalCount} Badges Unlocked
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={isLight ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ─── Hero Streak Card ─── */}
            <View
              style={[
                styles.streakHeroCard,
                {
                  backgroundColor: isLight ? '#FFFBEB' : '#1C1917',
                  borderColor: isLight ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)',
                },
              ]}
            >
              <View style={styles.streakHeroRow}>
                <View style={styles.flameCircle}>
                  <Flame size={28} color="#F97316" />
                </View>
                <View style={styles.streakHeroTextCol}>
                  <Text style={styles.streakHeroEyebrow}>CURRENT TRACKING STREAK</Text>
                  <Text style={[styles.streakHeroDays, { color: isLight ? '#92400E' : '#FBBF24' }]}>
                    {summary.currentStreakDays} {summary.currentStreakDays === 1 ? 'Day' : 'Days'}
                  </Text>
                  <Text style={styles.streakHeroSubtext}>
                    {summary.currentStreakDays > 0
                      ? 'Consistent tracking builds effortless wealth.'
                      : 'Log an expense today to spark your streak!'}
                  </Text>
                </View>
              </View>

              {/* Best record footnote */}
              <View style={styles.recordDivider} />
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Longest Streak Record:</Text>
                <Text style={styles.recordValue}>
                  {summary.longestStreakDays} {summary.longestStreakDays === 1 ? 'Day' : 'Days'} 🔥
                </Text>
              </View>
            </View>

            {/* ─── Badges Showcase ─── */}
            <Text style={[styles.sectionHeading, { color: isLight ? '#475569' : '#94A3B8' }]}>
              ACHIEVEMENTS COLLECTION
            </Text>

            <View style={styles.badgesList}>
              {summary.achievements.map((item) => {
                const isUnlocked = item.unlockedAt !== null;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.badgeCard,
                      {
                        backgroundColor: isLight
                          ? (isUnlocked ? '#F8FAFC' : '#F1F5F9')
                          : (isUnlocked ? '#181B26' : '#14161F'),
                        borderColor: isLight
                          ? (isUnlocked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.06)')
                          : (isUnlocked ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)'),
                        opacity: isUnlocked ? 1 : 0.75,
                      },
                    ]}
                  >
                    {/* Emoji badge */}
                    <View
                      style={[
                        styles.badgeIconBox,
                        {
                          backgroundColor: isUnlocked
                            ? 'rgba(245, 158, 11, 0.15)'
                            : (isLight ? '#E2E8F0' : '#1F2330'),
                        },
                      ]}
                    >
                      <Text style={styles.badgeEmoji}>{item.emoji}</Text>
                    </View>

                    {/* Info */}
                    <View style={styles.badgeInfoCol}>
                      <View style={styles.badgeTitleRow}>
                        <Text
                          style={[
                            styles.badgeTitle,
                            { color: isLight ? '#0F172A' : '#F8FAFC' },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {isUnlocked ? (
                          <CheckCircle2 size={15} color="#10B981" />
                        ) : (
                          <Lock size={13} color={isLight ? '#94A3B8' : '#64748B'} />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.badgeDesc,
                          { color: isLight ? '#64748B' : '#94A3B8' },
                        ]}
                      >
                        {item.description}
                      </Text>

                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressTrack,
                            { backgroundColor: isLight ? '#E2E8F0' : '#272C3D' },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.round(item.progress * 100)}%`,
                                backgroundColor: isUnlocked ? '#10B981' : '#F59E0B',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressLabel}>{item.progressLabel}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
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
  container: {
    maxHeight: '85%',
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
  trophyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.heading,
    fontWeight: '700',
  },
  headerSubtitle: {
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
  scrollContent: {
    paddingBottom: 20,
  },
  streakHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  streakHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flameCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakHeroTextCol: {
    flex: 1,
  },
  streakHeroEyebrow: {
    fontSize: 9.5,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 0.7,
  },
  streakHeroDays: {
    fontSize: 24,
    fontFamily: FontFamily.numericBold,
    fontWeight: '800',
    marginTop: 2,
  },
  streakHeroSubtext: {
    fontSize: 11.5,
    fontFamily: FontFamily.body,
    color: '#94A3B8',
    marginTop: 2,
  },
  recordDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 11.5,
    fontFamily: FontFamily.body,
    color: '#94A3B8',
  },
  recordValue: {
    fontSize: 12,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: '#F59E0B',
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  badgesList: {
    gap: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeInfoCol: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badgeTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.heading,
    fontWeight: '700',
  },
  badgeDesc: {
    fontSize: 11.5,
    fontFamily: FontFamily.body,
    lineHeight: 15,
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: FontFamily.mono,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
