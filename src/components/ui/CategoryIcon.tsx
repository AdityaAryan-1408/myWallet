/**
 * MyWallet — Dynamic Category Icon Resolver
 * 
 * Maps stored icon string names to Lucide vector components.
 */

import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Coffee,
  Car,
  Fuel,
  Bus,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  Sparkles,
  Repeat,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Wallet,
  CreditCard,
  Building,
  Tag,
  Dumbbell,
  Music,
  Gamepad2,
  Book,
  LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBag,
  Coffee,
  Car,
  Fuel,
  Bus,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  Sparkles,
  Repeat,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Wallet,
  CreditCard,
  Building,
  Tag,
  Dumbbell,
  Music,
  Gamepad2,
  Book,
};

interface CategoryIconProps {
  name?: string;
  icon?: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ name, icon, size = 18, color = '#FFFFFF' }: CategoryIconProps) {
  const iconKey = name || icon || '';
  const IconComponent = ICON_MAP[iconKey] || HelpCircle;
  return <IconComponent size={size} color={color} />;
}

export const AVAILABLE_CATEGORY_ICONS = Object.keys(ICON_MAP);
