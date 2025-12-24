import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Font Families - Platform-specific with fallbacks
export const FontFamily = {
  // iOS: San Francisco (SF Pro)
  // Android: Roboto
  // Cross-platform fallback: Inter or Noto Sans
  regular: Platform.select({
    ios: 'System', // Uses SF Pro on iOS
    android: 'Roboto',
    default: 'Inter', // Fallback for web/other platforms
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'Inter-Medium',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'Inter-SemiBold',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'Inter-Bold',
  }),
};

export const Theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 100,
  },
  // Font Sizes: Body 14-16pt, Headings 17-24+pt, Labels/Buttons 14-16pt
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,      // Body text (smaller density)
    base: 16,    // Body text (standard) - 14-16pt range
    lg: 18,      // Subheading
    xl: 20,      // Heading (17-24pt range)
    xxl: 24,     // Large heading (17-24pt range)
    xxxl: 32,    // Extra large heading (24+pt)
  },
  fontWeight: {
    light: '300',
    regular: '400',    // Regular for body text
    medium: '500',     // Medium for headings and buttons
    semibold: '600',   // Semibold for headings and buttons
    bold: '700',       // Avoid overusing
  },
  // Line Heights: 1.3-1.5× for body text
  lineHeight: {
    xs: 14,      // 1.4× for 10pt
    sm: 17,      // ~1.42× for 12pt
    md: 20,      // ~1.43× for 14pt
    base: 24,    // 1.5× for 16pt (body text)
    lg: 27,      // 1.5× for 18pt
    xl: 30,      // 1.5× for 20pt
    xxl: 36,     // 1.5× for 24pt
    xxxl: 48,    // 1.5× for 32pt
  },
  // Typography presets for common use cases
  typography: {
    // Body text - Regular weight, 1.5× line height
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      fontFamily: FontFamily.regular,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      fontFamily: FontFamily.regular,
    },
    // Headings - Medium/Semibold weight
    heading: {
      fontSize: 24,
      lineHeight: 36,
      fontWeight: '600',
      fontFamily: FontFamily.semibold,
    },
    headingMedium: {
      fontSize: 20,
      lineHeight: 30,
      fontWeight: '600',
      fontFamily: FontFamily.semibold,
    },
    headingSmall: {
      fontSize: 18,
      lineHeight: 27,
      fontWeight: '500',
      fontFamily: FontFamily.medium,
    },
    // Labels and buttons - 14-16pt
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      fontFamily: FontFamily.medium,
    },
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500',
      fontFamily: FontFamily.medium,
    },
    // Caption text
    caption: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '400',
      fontFamily: FontFamily.regular,
    },
  },
  screen: {
    width,
    height,
  },
  // Theme-aware shadows helper function
  getShadows: (isDark) => ({
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.5 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.6 : 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  }),
  
  // Keep legacy shadows for backward compatibility
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export const MealTypes = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
};

export const ActivityLevels = {
  SEDENTARY: 'sedentary',
  LIGHT: 'light',
  MODERATE: 'moderate',
  ACTIVE: 'active',
  VERY_ACTIVE: 'very_active',
};

export const PostTypes = {
  MEAL: 'meal',
  PROGRESS: 'progress',
  SUCCESS_STORY: 'success_story',
};