import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const productionHost = 'https://tradeiq-backend-v0du.onrender.com';

const host = Platform.select({
  android: productionHost,
  ios: productionHost,
  default: productionHost,
});

export const api = axios.create({
  baseURL: host,
  timeout: 5000,
});

let accessToken: string | null = null;
let currentUserId: string | null = null;
const sessionStorageKey = 'tradeiq.backend.session';

api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export async function clearBackendSession() {
  accessToken = null;
  currentUserId = null;
  await AsyncStorage.removeItem(sessionStorageKey);
}

async function setBackendSession<TUser extends { _id: string }>(session: {
  accessToken: string;
  user: TUser;
}) {
  accessToken = session.accessToken;
  currentUserId = session.user._id;
  await AsyncStorage.setItem(sessionStorageKey, JSON.stringify(session));
  return session.user;
}

export async function restoreBackendSession() {
  const savedSession = await AsyncStorage.getItem(sessionStorageKey);
  if (!savedSession) {
    return false;
  }

  const session = JSON.parse(savedSession) as {
    accessToken?: string;
    user?: { _id?: string };
  };

  if (!session.accessToken || !session.user?._id) {
    await clearBackendSession();
    return false;
  }

  accessToken = session.accessToken;
  currentUserId = session.user._id;
  return true;
}

export async function loginWithPassword(identifier: string, password: string) {
  const response = await api.post<{
    accessToken: string;
    user: { _id: string; fullName: string; email: string };
  }>('/api/auth/login', { identifier, password });
  return setBackendSession(response.data);
}

export async function loginWithGoogleProfile(input: {
  firebaseUid: string;
  email: string;
  fullName: string;
}) {
  const response = await api.post<{
    accessToken: string;
    user: { _id: string; fullName: string; email: string };
  }>('/api/auth/google-login', input);
  return setBackendSession(response.data);
}

export async function registerWithPassword(input: {
  fullName: string;
  mobile: string;
  email: string;
  panNumber: string;
  password: string;
  studyGroup: 'APP' | 'CONTROL' | 'NONE';
}) {
  const response = await api.post<{
    accessToken: string;
    user: { _id: string; fullName: string; email: string };
  }>('/api/auth/register', input);
  return response.data.user;
}

export async function getBackendHealth() {
  const response = await api.get<{ status: string; service: string }>('/health');
  return response.data;
}

export async function getMarketIndices() {
  const response = await api.get('/api/markets/indices');
  return response.data.data as Array<{
    symbol: string;
    ltp: number;
    changePercent: number;
  }>;
}

export async function searchStocks(query: string) {
  const response = await api.get('/api/stocks/search', { params: { q: query } });
  return response.data.data as Array<{
    symbol: string;
    companyName: string;
    ltp: number;
    changePercent: number;
  }>;
}

export type DashboardData = {
  summary: {
    title: string;
    primaryMetric: string;
    invested: string;
    current: string;
  };
  wallet?: WalletData;
  watchlist: Array<{
    symbol: string;
    exchange: string;
    price: string;
    change: string;
  }>;
  holdings: Array<{
    symbol: string;
    quantity: string;
    pnl: string;
  }>;
  orders: Array<{
    symbol: string;
    detail: string;
    status: string;
  }>;
};

export type WalletTransaction = {
  amount: string;
  rawAmount?: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'SUCCESS' | 'PROCESSING' | 'FAILED';
  provider?: string;
  referenceId: string;
  description: string;
  createdAt?: string;
};

export type WalletData = {
  balance: string | number;
  formattedBalance?: string;
  transactions: WalletTransaction[];
};

export type ProfileData = {
  fullName: string;
  email: string;
  mobile: string;
  kycStatus: string;
  studyGroup: string;
  securityStatus: string;
};

export type IntelligenceData = {
  portfolioHealth: {
    score: number;
    label: string;
    drivers: string[];
  };
  aiRecommendation: {
    title: string;
    suggestions: string[];
  };
  risk: {
    score: number;
    level: string;
    factors: string[];
  };
  predictiveAlerts: Array<{
    title: string;
    message: string;
    severity: string;
  }>;
  emotionalTrading: {
    status: string;
    signals: string[];
    coaching: string;
  };
  paperTrading: {
    balance: number;
    enabled: boolean;
    message: string;
  };
  aiAssistant: {
    prompts: string[];
  };
  voiceAssistant: {
    examples: string[];
    safety: string;
  };
};

export async function getDashboardData() {
  const response = await api.get<{ data: DashboardData }>('/api/dashboard');
  return response.data.data;
}

export async function addWalletFunds(amount: number) {
  const response = await api.post<{
    data: {
      wallet: WalletData;
      transaction: WalletTransaction;
    };
  }>('/api/wallet/add-funds', { amount });
  return response.data.data;
}

export async function getIntelligenceOverview() {
  const response = await api.get<{ data: IntelligenceData }>('/api/intelligence/overview');
  return response.data.data;
}

export async function getProfileData() {
  const response = await api.get<{ data: ProfileData }>('/api/profile/me');
  return response.data.data;
}

export async function placePaperOrder(input: {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  transactionType: 'BUY' | 'SELL';
  product: 'CNC' | 'MIS';
  quantity: number;
  price?: number;
  decisionToConfirmMs?: number;
  sessionId?: string;
}) {
  if (!currentUserId) {
    throw new Error('Please login before placing orders');
  }

  const response = await api.post('/api/orders/place', input);
  return response.data.data as { _id: string; status: string };
}

export async function logResearchEvent(eventType: string, payload: Record<string, unknown>) {
  const response = await api.post('/api/research/event', {
    eventType,
    payload,
    studyGroup: 'APP',
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
  return response.data.data as { _id: string };
}
