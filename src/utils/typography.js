import { Platform } from 'react-native';
import { Theme, FontFamily } from '../constants/Theme';

/**
 * Typography utility functions for consistent text styling
 * Follows WCAG guidelines and platform-specific best practices
 */

/**
 * Get typography style for body text
 * @param {Object} options - Style options
 * @returns {Object} Style object
 */
export const getBodyStyle = (options = {}) => {
  const {
    size = 'base', // 'base' (16pt) or 'small' (14pt)
    weight = 'regular',
    color,
    lineHeight,
  } = options;

  const fontSize = size === 'small' ? Theme.fontSize.md : Theme.fontSize.base;
  const calculatedLineHeight = lineHeight || Theme.lineHeight[size === 'small' ? 'md' : 'base'];

  return {
    fontSize,
    lineHeight: calculatedLineHeight,
    fontWeight: Theme.fontWeight[weight],
    fontFamily: FontFamily[weight],
    color,
    // Support system font scaling
    allowFontScaling: true,
  };
};

/**
 * Get typography style for headings
 * @param {Object} options - Style options
 * @returns {Object} Style object
 */
export const getHeadingStyle = (options = {}) => {
  const {
    level = 1, // 1 (24pt), 2 (20pt), 3 (18pt)
    weight = 'semibold',
    color,
    lineHeight,
  } = options;

  const sizeMap = {
    1: { fontSize: Theme.fontSize.xxl, lineHeightKey: 'xxl' },
    2: { fontSize: Theme.fontSize.xl, lineHeightKey: 'xl' },
    3: { fontSize: Theme.fontSize.lg, lineHeightKey: 'lg' },
  };

  const { fontSize, lineHeightKey } = sizeMap[level] || sizeMap[1];
  const calculatedLineHeight = lineHeight || Theme.lineHeight[lineHeightKey];

  return {
    fontSize,
    lineHeight: calculatedLineHeight,
    fontWeight: Theme.fontWeight[weight],
    fontFamily: FontFamily[weight],
    color,
    allowFontScaling: true,
  };
};

/**
 * Get typography style for labels and buttons
 * @param {Object} options - Style options
 * @returns {Object} Style object
 */
export const getLabelStyle = (options = {}) => {
  const {
    size = 'base', // 'base' (16pt) or 'small' (14pt)
    weight = 'medium',
    color,
    lineHeight,
  } = options;

  const fontSize = size === 'small' ? Theme.fontSize.md : Theme.fontSize.base;
  const calculatedLineHeight = lineHeight || Theme.lineHeight[size === 'small' ? 'md' : 'base'];

  return {
    fontSize,
    lineHeight: calculatedLineHeight,
    fontWeight: Theme.fontWeight[weight],
    fontFamily: FontFamily[weight],
    color,
    allowFontScaling: true,
  };
};

/**
 * Get typography style for captions
 * @param {Object} options - Style options
 * @returns {Object} Style object
 */
export const getCaptionStyle = (options = {}) => {
  const { color, lineHeight } = options;

  return {
    fontSize: Theme.fontSize.sm,
    lineHeight: lineHeight || Theme.lineHeight.sm,
    fontWeight: Theme.fontWeight.regular,
    fontFamily: FontFamily.regular,
    color,
    allowFontScaling: true,
  };
};

/**
 * Apply typography preset
 * @param {string} preset - Preset name ('body', 'heading', 'label', 'button', 'caption')
 * @param {Object} overrides - Style overrides
 * @returns {Object} Style object
 */
export const applyTypography = (preset, overrides = {}) => {
  const presets = Theme.typography;
  const baseStyle = presets[preset] || presets.body;

  return {
    ...baseStyle,
    ...overrides,
    allowFontScaling: true,
  };
};

/**
 * Get text style with proper spacing
 * @param {Object} options - Style options
 * @returns {Object} Style object with margin
 */
export const getTextWithSpacing = (typographyStyle, spacing = {}) => {
  return {
    ...typographyStyle,
    marginTop: spacing.top || 0,
    marginBottom: spacing.bottom || 0,
    marginLeft: spacing.left || 0,
    marginRight: spacing.right || 0,
    paddingTop: spacing.paddingTop || 0,
    paddingBottom: spacing.paddingBottom || 0,
    paddingLeft: spacing.paddingLeft || 0,
    paddingRight: spacing.paddingRight || 0,
  };
};

