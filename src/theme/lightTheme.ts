import { buildTheme, type TradeIQColors } from './theme';

export const lightColors: TradeIQColors = {
  bg: '#F8FAFC',
  bgSecondary: '#E2E8F0',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  input: '#FFFFFF',
  border: '#CBD5E1',
  text: '#334155',
  textStrong: '#0F172A',
  muted: '#64748B',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  accent: '#2563EB',
  cyan: '#38BDF8',
  buy: '#00B894',
  sell: '#E63946',
  warning: '#F59E0B',
  info: '#0EA5E9',
  chartGrid: '#CBD5E1',
  candleUp: '#00B894',
  candleDown: '#E63946',
  volume: '#38BDF8',
  movingAverage: '#F59E0B',
  rsi: '#8B5CF6',
  macd: '#06B6D4',
  glass: 'rgba(255,255,255,0.7)',
  shadow: 'rgba(15,23,42,0.08)',
  tabBg: '#FFFFFF',
  skeleton: '#E2E8F0',
};

export const lightTheme = buildTheme('light', lightColors);
