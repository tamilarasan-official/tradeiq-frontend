import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DashboardData,
  ProfileData,
  getDashboardData,
  getMarketIndices,
  getProfileData,
  loginWithGoogleProfile,
  loginWithPassword,
  placePaperOrder,
  registerWithPassword,
  searchStocks,
} from '../../services/api';
import { registerFcmToken, signInWithGoogle } from '../../services/firebase';
import { colors } from '../../theme/colors';
import type { ScreenSpec } from '../../types/screens';
import { showToast } from '../../utils/toast';

const tradeIqLogo = require('../../Assets/TradeIQ_logo_v3.png');

type Props = {
  screen: ScreenSpec;
  onBack: () => void;
  onNavigate: (screenId: number) => void;
  onLogout?: () => void;
};

export function BaseSpecScreen({ screen, onBack, onNavigate, onLogout }: Props) {
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ symbol: string; companyName: string; ltp: number; changePercent: number }>>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [indices, setIndices] = useState<Array<{ symbol: string; ltp: number; changePercent: number }>>([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [dashboardData, profileData, indexData] = await Promise.all([
          getDashboardData(),
          getProfileData(),
          getMarketIndices(),
        ]);

        if (mounted) {
          setDashboard(dashboardData);
          setProfile(profileData);
          setIndices(indexData);
        }
      } catch {
        if (mounted) {
          showToast('Unable to load live app data');
        }
      }
    }

    if (screen.id > 8) {
      loadData();
    }

    return () => {
      mounted = false;
    };
  }, [screen.id]);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      if (screen.id === 14) {
        const data = await searchStocks(formState['Search query'] || 'RELIANCE');
        setResults(data);
        showToast(`${data.length} stocks found`);
        return;
      }

      if (screen.id === 5 && action.toLowerCase() === 'login') {
        const user = await loginWithPassword(
          formState['Mobile or Email'] ?? '',
          formState.Password ?? '',
        );
        showToast(`Welcome ${user.fullName}`);
        onNavigate(9);
        return;
      }

      if (screen.id === 4 && action.toLowerCase() === 'create account') {
        const user = await registerWithPassword({
          fullName: formState['Full name'] ?? '',
          mobile: formState.Mobile ?? '',
          email: formState.Email ?? '',
          panNumber: (formState.PAN ?? '').toUpperCase(),
          password: formState.Password ?? '',
          studyGroup: 'APP',
        });
        showToast(`Account created for ${user.fullName}. Please login.`);
        onNavigate(5);
        return;
      }

      if (screen.id === 18 && action.toLowerCase() === 'confirm order') {
        const order = await placePaperOrder({
          symbol: formState.Symbol || 'RELIANCE',
          exchange: 'NSE',
          orderType: 'MARKET',
          transactionType: 'BUY',
          product: 'CNC',
          quantity: Number(formState.Quantity || 1),
          price: Number(formState.Price || 2850),
          decisionToConfirmMs: 4320,
          sessionId: 'mobile-demo-session',
        });
        showToast(`Order ${order.status}`);
        onNavigate(19);
        return;
      }

      const next = nextScreenForAction(screen.id, action);
      showToast(`${action} completed`);
      if (next) {
        onNavigate(next);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `${action} failed`;
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const credential = await signInWithGoogle();
      const user = await loginWithGoogleProfile({
        firebaseUid: credential.user.uid,
        email: credential.user.email ?? `${credential.user.uid}@firebase.tradeiq.app`,
        fullName: credential.user.displayName ?? 'TradeIQ Investor',
      });
      showToast(`Welcome ${user.fullName}`);
      onNavigate(9);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404 &&
        error.response.data?.code === 'ACCOUNT_REQUIRED'
      ) {
        showToast('Create your account before using Google sign-in');
        onNavigate(4);
        return;
      }
      showToast(error instanceof Error ? error.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleFcmSetup() {
    setLoading(true);
    try {
      await registerFcmToken();
      showToast('Notifications enabled');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Notification setup failed');
    } finally {
      setLoading(false);
    }
  }

  if (screen.id === 5) {
    return (
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.loginContent}>
          <Image source={tradeIqLogo} style={styles.authLogo} resizeMode="contain" />
          <Text style={styles.loginTitle}>Welcome back</Text>
          <Text style={styles.loginSubtitle}>Trade, track, and manage your portfolio securely.</Text>

          <View style={styles.authPanel}>
            <Input
              label="Email or mobile"
              placeholder="Email or mobile"
              value={formState['Mobile or Email'] ?? ''}
              onChangeText={value =>
                setFormState(current => ({ ...current, 'Mobile or Email': value }))
              }
            />
            <Input
              label="Password"
              placeholder="Password"
              secureTextEntry
              value={formState.Password ?? ''}
              onChangeText={value =>
                setFormState(current => ({ ...current, Password: value }))
              }
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleAction('Login')}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleAction('Reset Password')}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.authFooterLink} onPress={() => onNavigate(4)}>
            <Text style={styles.createAccountText}>Create account</Text>
          </TouchableOpacity>

          {loading ? <ActivityIndicator color={colors.buy} style={styles.loader} /> : null}
        </ScrollView>
      </View>
    );
  }

  if (screen.id === 4) {
    return (
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.loginContent}>
          <Image source={tradeIqLogo} style={styles.authLogo} resizeMode="contain" />
          <Text style={styles.loginTitle}>Create account</Text>
          <Text style={styles.loginSubtitle}>Open your TradeIQ profile and continue KYC.</Text>

          <View style={styles.authPanel}>
            <Input label="Full name" placeholder="Full name" value={formState['Full name'] ?? ''} onChangeText={value => setFormState(current => ({ ...current, 'Full name': value }))} />
            <Input label="Mobile" placeholder="10 digit mobile number" keyboardType="number-pad" value={formState.Mobile ?? ''} onChangeText={value => setFormState(current => ({ ...current, Mobile: value }))} />
            <Input label="Email" placeholder="Email address" value={formState.Email ?? ''} onChangeText={value => setFormState(current => ({ ...current, Email: value }))} />
            <Input label="PAN" placeholder="ABCDE1234F" value={formState.PAN ?? ''} onChangeText={value => setFormState(current => ({ ...current, PAN: value.toUpperCase() }))} />
            <Input label="Password" placeholder="Minimum 8 characters" secureTextEntry value={formState.Password ?? ''} onChangeText={value => setFormState(current => ({ ...current, Password: value }))} />

            <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('Create Account')} disabled={loading}>
              <Text style={styles.primaryButtonText}>Create account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.authFooterLink} onPress={() => onNavigate(5)}>
            <Text style={styles.createAccountText}>Already have an account? Login</Text>
          </TouchableOpacity>

          {loading ? <ActivityIndicator color={colors.buy} style={styles.loader} /> : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle(screen.name)}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate(28)}>
            <Text style={styles.iconButtonText}>!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              showToast('Logged out');
              onLogout?.();
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Hero screen={screen} dashboard={dashboard} />

        {renderScreenBody(
          screen,
          formState,
          setFormState,
          results,
          onNavigate,
          handleFcmSetup,
          dashboard,
          profile,
          indices,
        )}

        <View style={styles.actionGrid}>
          {screen.actions.map(action => (
            <TouchableOpacity
              key={action}
              style={[
                styles.actionButton,
                action.toLowerCase().includes('sell') && styles.sellButton,
                action.toLowerCase().includes('skip') && styles.secondaryButton,
              ]}
              onPress={() => handleAction(action)}
              disabled={loading}
            >
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={colors.buy} style={styles.loader} /> : null}
      </ScrollView>
      <BottomTabs activeScreenId={screen.id} onNavigate={onNavigate} />
    </View>
  );
}

function Hero({ screen, dashboard }: { screen: ScreenSpec; dashboard: DashboardData | null }) {
  if ([9, 11, 15, 20, 22, 23, 24].includes(screen.id)) {
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{screenTitle(screen.name)}</Text>
        <Text style={styles.heroValue}>
          {screen.id === 9
            ? dashboard?.summary.primaryMetric ?? 'Loading...'
            : screen.primaryMetric ?? 'Loading...'}
        </Text>
      </View>
    );
  }

  return <Text style={styles.pageTitle}>{screenTitle(screen.name)}</Text>;
}

function renderScreenBody(
  screen: ScreenSpec,
  formState: Record<string, string>,
  setFormState: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  results: Array<{ symbol: string; companyName: string; ltp: number; changePercent: number }>,
  onNavigate: (screenId: number) => void,
  handleFcmSetup: () => void,
  dashboard: DashboardData | null,
  profile: ProfileData | null,
  indices: Array<{ symbol: string; ltp: number; changePercent: number }>,
) {
  if (screen.id === 6) {
    return (
      <View style={styles.card}>
        <Input label="OTP" placeholder="Enter 6-digit OTP" keyboardType="number-pad" value={formState.OTP ?? ''} onChangeText={value => setFormState(current => ({ ...current, OTP: value }))} />
      </View>
    );
  }

  if (screen.id === 7) {
    return (
      <View style={styles.grid}>
        {['PAN card', 'Aadhaar front', 'Aadhaar back', 'Bank proof', 'Selfie'].map(item => (
          <InfoTile key={item} title={item} value="Pending" />
        ))}
      </View>
    );
  }

  if (screen.id === 8) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Secure login</Text>
        <Text style={styles.mutedText}>Enable biometric login for faster access and order confirmation.</Text>
      </View>
    );
  }

  if (screen.id === 9) {
    return (
      <>
        <View style={styles.grid}>
          <InfoTile title="Invested" value={dashboard?.summary.invested ?? 'Loading...'} />
          <InfoTile title="Current" value={dashboard?.summary.current ?? 'Loading...'} tone="positive" />
        </View>
        <IndicesStrip indices={indices} />
        <MarketList onNavigate={onNavigate} watchlist={dashboard?.watchlist ?? []} />
        <OrderList orders={dashboard?.orders ?? []} />
      </>
    );
  }

  if (screen.id === 10) {
    return <MarketList onNavigate={onNavigate} watchlist={dashboard?.watchlist ?? []} />;
  }

  if ([11, 20].includes(screen.id)) {
    return <HoldingsList onNavigate={onNavigate} holdings={dashboard?.holdings ?? []} />;
  }

  if (screen.id === 12) {
    return <OrderList orders={dashboard?.orders ?? []} />;
  }

  if (screen.id === 13) {
    return (
      <>
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {(profile?.fullName ?? 'T').slice(0, 1).toUpperCase()}
            </Text>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <View style={styles.profileIdentity}>
            <Text style={styles.profileName}>{profile?.fullName ?? 'Loading profile...'}</Text>
            <Text style={styles.profileEmail}>{profile?.email ?? ''}</Text>
          </View>
        </View>

        <View style={styles.portfolioStrip}>
          <View>
            <Text style={styles.tileTitle}>Total Portfolio Value</Text>
            <Text style={styles.profilePortfolioValue}>
              {dashboard?.summary.current ?? 'Loading...'}
            </Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.positive}>+4.2%</Text>
            <Text style={styles.mutedText}>Today</Text>
          </View>
        </View>

        <SectionLabel title="Personal Details" />
        <View style={styles.detailCard}>
          <DetailRow label="Full Name" value={profile?.fullName ?? 'Loading...'} />
          <DetailRow label="Email" value={profile?.email ?? 'Loading...'} />
          <DetailRow label="Phone Number" value={profile?.mobile ?? 'Loading...'} />
        </View>

        <SectionLabel title="Security & Privacy" />
        <View style={styles.detailCard}>
          <DetailRow label="Biometric Login" value={profile?.securityStatus ?? 'Loading...'} tone="positive" />
          <DetailRow label="KYC Status" value={profile?.kycStatus ?? 'Loading...'} />
          <DetailRow label="Study Group" value={profile?.studyGroup ?? 'Loading...'} />
          <TouchableOpacity style={styles.secondaryWideButton} onPress={handleFcmSetup}>
            <Text style={styles.secondaryWideText}>Enable Push Notifications</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (screen.id === 14) {
    return (
      <>
        <Input label="Search" placeholder="Search stocks" value={formState['Search query'] ?? 'RELIANCE'} onChangeText={value => setFormState(current => ({ ...current, 'Search query': value }))} />
        {results.map(stock => (
          <TouchableOpacity key={stock.symbol} style={styles.listRow} onPress={() => onNavigate(15)}>
            <View>
              <Text style={styles.symbol}>{stock.symbol}</Text>
              <Text style={styles.mutedText}>{stock.companyName}</Text>
            </View>
            <Text style={stock.changePercent >= 0 ? styles.positive : styles.negative}>{stock.changePercent.toFixed(2)}%</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  }

  if ([16, 17, 18, 27].includes(screen.id)) {
    return (
      <View style={styles.card}>
        {(screen.fields ?? ['Symbol', 'Quantity', 'Price']).map(field => (
          <Input key={field} label={field} placeholder={field} value={formState[field] ?? defaultFieldValue(field)} onChangeText={value => setFormState(current => ({ ...current, [field]: value }))} />
        ))}
      </View>
    );
  }

  if (screen.id === 28) {
    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.secondaryWideButton} onPress={handleFcmSetup}>
          <Text style={styles.secondaryWideText}>Enable Push Notifications</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {screen.sections.map(section => (
        <InfoTile key={section} title={section} value="Ready" />
      ))}
    </View>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function MarketList({
  onNavigate,
  watchlist,
}: {
  onNavigate: (screenId: number) => void;
  watchlist: DashboardData['watchlist'];
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Watchlist</Text>
      {watchlist.length === 0 ? <EmptyState title="No watchlist stocks" /> : null}
      {watchlist.map(item => (
        <TouchableOpacity key={item.symbol} style={styles.listRow} onPress={() => onNavigate(15)}>
          <View>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.mutedText}>{item.exchange}</Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={item.change.startsWith('+') ? styles.positive : styles.negative}>{item.change}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HoldingsList({
  onNavigate,
  holdings,
}: {
  onNavigate: (screenId: number) => void;
  holdings: DashboardData['holdings'];
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Holdings</Text>
      {holdings.length === 0 ? <EmptyState title="No holdings yet" /> : null}
      {holdings.map(item => (
        <TouchableOpacity key={item.symbol} style={styles.listRow} onPress={() => onNavigate(15)}>
          <View>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.mutedText}>{item.quantity}</Text>
          </View>
          <Text style={item.pnl.startsWith('+') ? styles.positive : styles.negative}>{item.pnl}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function OrderList({ orders }: { orders: DashboardData['orders'] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Orders</Text>
      {orders.length === 0 ? <EmptyState title="No orders yet" /> : null}
      {orders.map(item => (
        <View key={`${item.symbol}-${item.status}`} style={styles.listRow}>
          <View>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.mutedText}>{item.detail}</Text>
          </View>
          <Text style={styles.statusPill}>{item.status}</Text>
        </View>
      ))}
    </View>
  );
}

function IndicesStrip({ indices }: { indices: Array<{ symbol: string; ltp: number; changePercent: number }> }) {
  if (indices.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.indicesScroller}>
      {indices.map(index => (
        <View key={index.symbol} style={styles.indexCard}>
          <Text style={styles.indexSymbol}>{index.symbol}</Text>
          <Text style={styles.indexPrice}>{index.ltp.toLocaleString('en-IN')}</Text>
          <Text style={index.changePercent >= 0 ? styles.positive : styles.negative}>
            {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );
}

function InfoTile({ title, value, tone }: { title: string; value: string; tone?: 'positive' }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={[styles.tileValue, tone === 'positive' && styles.positive]}>{value}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive';
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, tone === 'positive' && styles.positive]}>
        {value}
      </Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function BottomTabs({
  activeScreenId,
  onNavigate,
}: {
  activeScreenId: number;
  onNavigate: (screenId: number) => void;
}) {
  const tabs = [
    { label: 'Home', icon: 'H', screenId: 9 },
    { label: 'Holdings', icon: 'P', screenId: 20 },
    { label: 'Trade', icon: '+', screenId: 14 },
    { label: 'Wallet', icon: 'W', screenId: 11 },
    { label: 'Alerts', icon: '!', screenId: 27 },
    { label: 'Profile', icon: 'U', screenId: 13 },
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map(tab => {
        const active = tab.screenId === activeScreenId;
        return (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tabItem, active && styles.activeTabItem]}
            onPress={() => onNavigate(tab.screenId)}
          >
            <Text style={[styles.tabIcon, active && styles.activeTabText]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, active && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function nextScreenForAction(screenId: number, action: string) {
  const key = `${screenId}:${action.toLowerCase()}`;
  const map: Record<string, number> = {
    '4:create account': 7,
    '4:login': 5,
    '5:login': 6,
    '5:reset password': 6,
    '6:verify': 7,
    '7:continue': 8,
    '8:enable': 9,
    '8:skip': 9,
    '9:buy': 16,
    '9:sell': 17,
    '9:search': 14,
    '10:open stock': 15,
    '11:view holdings': 20,
    '11:analyse p&l': 21,
    '15:buy': 16,
    '15:sell': 17,
    '15:set alert': 27,
    '16:preview buy': 18,
    '17:preview sell': 18,
    '18:edit': 16,
    '19:view orders': 12,
    '19:back to home': 9,
    '20:quick sell': 17,
    '20:view stock': 15,
    '20:set alert': 27,
    '31:view consent': 3,
  };
  return map[key];
}

function defaultFieldValue(field: string) {
  const defaults: Record<string, string> = {
    Symbol: 'RELIANCE',
    Quantity: '1',
    Price: '2850',
    'Search query': 'RELIANCE',
  };
  return defaults[field] ?? '';
}

function screenTitle(name: string) {
  return name
    .replace(' Screen', '')
    .replace(' / Chart', '')
    .replace(' / Confirm', '')
    .replace(' / Failure', '')
    .replace('Dashboard / ', '');
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: colors.bg, flex: 1 },
  topbar: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backIcon: { color: colors.textStrong, fontSize: 34, fontWeight: '400' },
  headerTitle: {
    color: colors.textStrong,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconButtonText: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,77,77,0.14)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  logoutText: {
    color: colors.sell,
    fontSize: 12,
    fontWeight: '900',
  },
  content: { padding: 16, paddingBottom: 128 },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authLogo: {
    alignSelf: 'center',
    height: 104,
    marginBottom: 16,
    width: 210,
  },
  authPanel: {
    backgroundColor: '#111925',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  authFooterLink: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  logoMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.buy,
    borderRadius: 16,
    height: 64,
    justifyContent: 'center',
    marginBottom: 20,
    width: 64,
  },
  logoText: { color: colors.bg, fontSize: 22, fontWeight: '900' },
  loginTitle: {
    color: colors.textStrong,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  pageTitle: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  heroLabel: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  heroValue: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  cardTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: '45%',
    padding: 14,
  },
  tileTitle: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  tileValue: {
    color: colors.textStrong,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#070B12',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.textStrong,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.buy,
    borderRadius: 10,
    marginTop: 6,
    paddingVertical: 15,
  },
  primaryButtonText: { color: colors.bg, fontSize: 16, fontWeight: '900' },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.textStrong,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 15,
  },
  googleIcon: { color: colors.bg, fontSize: 18, fontWeight: '900' },
  googleText: { color: colors.bg, fontSize: 16, fontWeight: '900' },
  linkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
  createAccountText: {
    color: colors.buy,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 18,
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: colors.buy,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  sellButton: { backgroundColor: colors.sell },
  secondaryButton: { backgroundColor: colors.surface2 },
  actionText: { color: colors.textStrong, fontWeight: '900' },
  listRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  symbol: { color: colors.textStrong, fontSize: 16, fontWeight: '900' },
  mutedText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  alignRight: { alignItems: 'flex-end' },
  price: { color: colors.textStrong, fontWeight: '900' },
  positive: { color: colors.buy, fontWeight: '900' },
  negative: { color: colors.sell, fontWeight: '900' },
  statusPill: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  indicesScroller: {
    marginBottom: 16,
  },
  indexCard: {
    backgroundColor: '#101B2D',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 124,
    padding: 12,
  },
  indexSymbol: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  indexPrice: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 5,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#0B101B',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryWideButton: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingVertical: 14,
  },
  secondaryWideText: { color: colors.textStrong, fontWeight: '900' },
  loader: { marginTop: 18 },
  bottomTabs: {
    backgroundColor: '#0F1B2F',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 10,
    paddingTop: 9,
    position: 'absolute',
    right: 0,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 52,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  activeTabItem: {
    backgroundColor: 'rgba(0,196,140,0.14)',
  },
  tabIcon: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '900',
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  activeTabText: {
    color: colors.accent,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    marginBottom: 24,
  },
  avatarBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarText: {
    color: colors.buy,
    fontSize: 34,
    fontWeight: '900',
  },
  proBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    bottom: -10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
  },
  proText: {
    color: colors.textStrong,
    fontSize: 11,
    fontWeight: '900',
  },
  profileIdentity: {
    flex: 1,
  },
  profileName: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '900',
  },
  profileEmail: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 4,
  },
  portfolioStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profilePortfolioValue: {
    color: colors.textStrong,
    fontSize: 27,
    fontWeight: '900',
    marginTop: 8,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 12,
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: '#202128',
    borderColor: '#373942',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  detailLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 16,
  },
  detailValue: {
    color: colors.textStrong,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
});
