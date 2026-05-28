import { buildTheme, type TradeIQColors } from './theme';

export const darkColors: TradeIQColors = {
  bg: '#020617',
  bgSecondary: '#0F172A',
  surface: '#111827',
  surface2: '#1E293B',
  input: '#1A2234',
  border: '#233046',
  text: '#CBD5E1',
  textStrong: '#F8FAFC',
  muted: '#64748B',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  accent: '#2563EB',
  cyan: '#06B6D4',
  buy: '#00D4AA',
  sell: '#FF4D6D',
  warning: '#F59E0B',
  info: '#38BDF8',
  chartGrid: '#1E293B',
  candleUp: '#00D4AA',
  candleDown: '#FF4D6D',
  volume: '#38BDF8',
  movingAverage: '#F59E0B',
  rsi: '#8B5CF6',
  macd: '#06B6D4',
  glass: 'rgba(255,255,255,0.06)',
  shadow: 'rgba(0,0,0,0.35)',
  tabBg: '#0F172A',
  skeleton: '#1E293B',
};

export const darkTheme = buildTheme('dark', darkColors);
