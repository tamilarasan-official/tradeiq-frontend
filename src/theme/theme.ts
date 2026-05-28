export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

export type TradeIQColors = {
  bg: string;
  bgSecondary: string;
  surface: string;
  surface2: string;
  input: string;
  border: string;
  text: string;
  textStrong: string;
  muted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  cyan: string;
  buy: string;
  sell: string;
  warning: string;
  info: string;
  chartGrid: string;
  candleUp: string;
  candleDown: string;
  volume: string;
  movingAverage: string;
  rsi: string;
  macd: string;
  glass: string;
  shadow: string;
  tabBg: string;
  skeleton: string;
};

export type TradeIQTheme = {
  mode: ResolvedThemeMode;
  colors: TradeIQColors;
  gradients: {
    primary: string[];
    card: string[];
    buy: string[];
    sell: string[];
    loading: string[];
    wallet: string[];
  };
  shadows: {
    sm: object;
    md: object;
    glow: object;
  };
  typography: {
    heading: object;
    body: object;
    label: object;
  };
  components: {
    button: {
      primary: object;
      buy: object;
      sell: object;
      secondary: object;
    };
    card: object;
    input: object;
    notification: {
      success: object;
      error: object;
      warning: object;
      info: object;
    };
  };
};

export const brandColors = {
  primaryBlue: '#2563EB',
  darkNavy: '#0B1120',
  accentCyan: '#06B6D4',
  successGreen: '#00D4AA',
  dangerRed: '#FF4D6D',
  warningOrange: '#F59E0B',
  pureWhite: '#FFFFFF',
  softGray: '#94A3B8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export function buildTheme(mode: ResolvedThemeMode, colors: TradeIQColors): TradeIQTheme {
  const isDark = mode === 'dark';

  return {
    mode,
    colors,
    gradients: {
      primary: isDark ? ['#2563EB', '#06B6D4'] : ['#2563EB', '#38BDF8'],
      card: isDark ? ['#0F172A', '#111827'] : ['#FFFFFF', '#F8FAFC'],
      buy: ['#00D4AA', '#00B894'],
      sell: ['#FF4D6D', '#E63946'],
      loading: ['#2563EB', '#06B6D4'],
      wallet: ['#2563EB', '#0EA5E9'],
    },
    shadows: {
      sm: {
        shadowColor: colors.shadow,
        shadowOpacity: isDark ? 0.28 : 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
      md: {
        shadowColor: colors.shadow,
        shadowOpacity: isDark ? 0.38 : 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      },
      glow: {
        shadowColor: colors.primary,
        shadowOpacity: isDark ? 0.34 : 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      },
    },
    typography: {
      heading: { color: colors.textStrong, fontWeight: '900', letterSpacing: 0 },
      body: { color: colors.text, letterSpacing: 0 },
      label: { color: colors.muted, fontWeight: '800', letterSpacing: 0 },
    },
    components: {
      button: {
        primary: { backgroundColor: colors.primary, borderColor: colors.primary },
        buy: { backgroundColor: colors.buy, borderColor: colors.buy },
        sell: { backgroundColor: colors.sell, borderColor: colors.sell },
        secondary: { backgroundColor: colors.surface2, borderColor: colors.border },
      },
      card: { backgroundColor: colors.surface, borderColor: colors.border },
      input: { backgroundColor: colors.input, borderColor: colors.border, color: colors.textStrong },
      notification: {
        success: { backgroundColor: colors.buy },
        error: { backgroundColor: colors.sell },
        warning: { backgroundColor: colors.warning },
        info: { backgroundColor: colors.info },
      },
    },
  };
}

export const chartColors = {
  bullishCandle: '#00D4AA',
  bearishCandle: '#FF4D6D',
  volumeBars: '#38BDF8',
  movingAverage: '#F59E0B',
  rsi: '#8B5CF6',
  macd: '#06B6D4',
};

export const tailwindThemeColors = {
  tradeiq: {
    blue: '#2563EB',
    navy: '#0B1120',
    cyan: '#06B6D4',
    success: '#00D4AA',
    danger: '#FF4D6D',
    warning: '#F59E0B',
    muted: '#94A3B8',
  },
};
