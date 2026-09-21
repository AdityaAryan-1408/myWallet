import { MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { Colors } from './colors';

export const PaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
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
