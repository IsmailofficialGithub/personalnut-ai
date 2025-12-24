# Typography Guide

This document outlines the typography system used throughout the application, following WCAG accessibility guidelines and platform-specific best practices.

## Font Families

### Platform-Specific Fonts
- **iOS**: San Francisco (SF Pro) - System default
- **Android**: Roboto - System default
- **Cross-platform fallback**: Inter (for web/other platforms)

The app automatically selects the appropriate font family based on the platform.

## Font Sizes

| Size | Value | Usage |
|------|-------|-------|
| xs | 10pt | Extra small text |
| sm | 12pt | Small text, captions |
| md | 14pt | Body text (smaller density) |
| base | 16pt | Body text (standard) - **14-16pt range** |
| lg | 18pt | Subheading |
| xl | 20pt | Heading - **17-24pt range** |
| xxl | 24pt | Large heading - **17-24pt range** |
| xxxl | 32pt | Extra large heading - **24+pt** |

## Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| regular | 400 | Body text (default) |
| medium | 500 | Headings and buttons |
| semibold | 600 | Headings and buttons |
| bold | 700 | Avoid overusing |

**Guideline**: Use Regular for body text, Medium/Semibold for headings and buttons. Avoid overusing bold.

## Line Heights

Line heights are set to **1.3-1.5×** the font size for optimal readability:

| Font Size | Line Height | Ratio |
|-----------|-------------|-------|
| 10pt | 14pt | 1.4× |
| 12pt | 17pt | ~1.42× |
| 14pt | 20pt | ~1.43× |
| 16pt | 24pt | **1.5×** (body text) |
| 18pt | 27pt | 1.5× |
| 20pt | 30pt | 1.5× |
| 24pt | 36pt | 1.5× |
| 32pt | 48pt | 1.5× |

## Color Contrast (WCAG Compliance)

All text colors meet **WCAG AA standards** (minimum 4.5:1 contrast ratio):

### Light Mode
- **Primary text** (`#212121` on white): 15.8:1 (WCAG AAA)
- **Secondary text** (`#616161` on white): 7.0:1 (WCAG AA)

### Dark Mode
- **Primary text** (`#FFFFFF` on dark): 15.8:1 (WCAG AAA)
- **Secondary text** (`#BDBDBD` on dark): 7.0:1 (WCAG AA)

## Usage Examples

### Using Typography Utilities

```javascript
import { getBodyStyle, getHeadingStyle, getLabelStyle } from '../utils/typography';
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { colors } = useTheme();
  
  return (
    <View>
      {/* Heading */}
      <Text style={[getHeadingStyle({ level: 1, color: colors.text })]}>
        Main Heading
      </Text>
      
      {/* Body text */}
      <Text style={[getBodyStyle({ color: colors.text })]}>
        This is body text with proper line height and font size.
      </Text>
      
      {/* Label/Button text */}
      <Text style={[getLabelStyle({ color: colors.primary })]}>
        Button Label
      </Text>
    </View>
  );
};
```

### Using Typography Presets

```javascript
import { applyTypography } from '../utils/typography';
import { Theme } from '../constants/Theme';

// Apply preset with overrides
const bodyStyle = applyTypography('body', { color: '#000' });
const headingStyle = applyTypography('heading', { color: '#000' });
```

### Direct Theme Usage

```javascript
import { Theme, FontFamily } from '../constants/Theme';

const styles = StyleSheet.create({
  bodyText: {
    fontSize: Theme.fontSize.base,
    lineHeight: Theme.lineHeight.base,
    fontWeight: Theme.fontWeight.regular,
    fontFamily: FontFamily.regular,
    allowFontScaling: true, // Support system font scaling
  },
  heading: {
    fontSize: Theme.fontSize.xxl,
    lineHeight: Theme.lineHeight.xxl,
    fontWeight: Theme.fontWeight.semibold,
    fontFamily: FontFamily.semibold,
    allowFontScaling: true,
  },
});
```

## Spacing Guidelines

### Text Padding
- **Adequate padding** around text elements
- **Consistent margins** to maintain visual rhythm
- Avoid tight crowds of text

### Recommended Spacing
- Between paragraphs: 16-24pt
- Between heading and body: 8-16pt
- Section spacing: 24-32pt

## Font Scaling

All text components support **system font scaling**:
- Set `allowFontScaling: true` on all Text components
- Avoid fixed-height text containers
- Ensure text reflows properly when font size increases

## Best Practices

1. **Use semantic sizing**: Choose font sizes based on content hierarchy
2. **Maintain line height**: Always use 1.3-1.5× line height for body text
3. **Ensure contrast**: Use primary text color for main content, secondary for less important text
4. **Support scaling**: Always enable `allowFontScaling` for accessibility
5. **Consistent spacing**: Use Theme.spacing values for consistent margins and padding
6. **Avoid overusing bold**: Use medium/semibold for emphasis instead

## Typography Presets

The Theme includes pre-configured typography presets:

- `typography.body` - Standard body text (16pt, regular, 1.5× line height)
- `typography.bodySmall` - Smaller body text (14pt, regular, 1.43× line height)
- `typography.heading` - Main heading (24pt, semibold, 1.5× line height)
- `typography.headingMedium` - Medium heading (20pt, semibold, 1.5× line height)
- `typography.headingSmall` - Small heading (18pt, medium, 1.5× line height)
- `typography.label` - Label text (14pt, medium, 1.43× line height)
- `typography.button` - Button text (16pt, medium, 1.5× line height)
- `typography.caption` - Caption text (12pt, regular, 1.42× line height)

