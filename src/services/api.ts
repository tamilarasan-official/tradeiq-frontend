import axios from 'axios';
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

api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export function clearBackendSession() {
  accessToken = null;
  currentUserId = null;
}

function setBackendSession<TUser extends { _id: string }>(session: {
  accessToken: string;
  user: TUser;
}) {
  accessToken = session.accessToken;
  currentUserId = session.user._id;
  return session.user;
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
  }>('/api/auth/google', input);
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
  return setBackendSession(response.data);
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

export type ProfileData = {
  fullName: string;
  email: string;
  mobile: string;
  kycStatus: string;
  studyGroup: string;
  securityStatus: string;
};

export async function getDashboardData() {
  const response = await api.get<{ data: DashboardData }>('/api/dashboard');
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
