import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { Colors, getInitialTheme } from './colors';

const isLight = getInitialTheme() === 'light';
const baseTheme = isLight ? MD3LightTheme : MD3DarkTheme;

export const PaperTheme: MD3Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: Colors.primaryFixed,
    primaryContainer: Colors.primaryContainer,
    onPrimary: Colors.onPrimary,
    onPrimaryContainer: Colors.onPrimaryContainer,
    secondary: Colors.secondaryFixed,
    secondaryContainer: Colors.secondaryContainer,
    background: Colors.surface,
    surface: Colors.surfaceContainerLow,
    surfaceVariant: Colors.surfaceContainer,
    error: Colors.error,
    outline: Colors.strokeMedium,
  },
};

