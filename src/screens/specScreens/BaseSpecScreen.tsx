import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Bell as BellIcon,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  FileText,
  HelpCircle,
  Home as HomeIcon,
  ShieldCheck,
  Repeat2,
  User,
  Wallet,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DashboardData,
  IntelligenceData,
  ProfileData,
  addWalletFunds,
  getDashboardData,
  getIntelligenceOverview,
  getMarketIndices,
  getProfileData,
  loginWithGoogleProfile,
  loginWithPassword,
  placePaperOrder,
  registerWithPassword,
  searchStocks,
} from '../../services/api';
import {
  isBiometricLoginEnabled,
  promptBiometricLogin,
  setBiometricLoginEnabled,
} from '../../services/biometricAuth';
import { registerFcmToken, signInWithGoogle } from '../../services/firebase';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeMode, TradeIQColors } from '../../theme/theme';
import type { ScreenSpec } from '../../types/screens';
import { showToast } from '../../utils/toast';

const tradeIqLogo = require('../../Assets/TradeIQ_logo_v3.png');

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const issues = error.response?.data?.issues;
    if (Array.isArray(issues) && issues[0]?.message) {
      return String(issues[0].message);
    }

    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return error instanceof Error ? error.message : fallback;
}

function validateLoginForm(formState: Record<string, string>) {
  if (!(formState['Mobile or Email'] ?? '').trim()) {
    return 'Enter email or mobile number';
  }

  if (!(formState.Password ?? '').trim()) {
    return 'Enter password';
  }

  return null;
}

function validateRegisterForm(formState: Record<string, string>) {
  const fullName = (formState['Full name'] ?? '').trim();
  const mobile = (formState.Mobile ?? '').trim();
  const email = (formState.Email ?? '').trim();
  const pan = (formState.PAN ?? '').trim().toUpperCase();
  const password = formState.Password ?? '';

  if (fullName.length < 3) {
    return 'Full name must be at least 3 characters';
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return 'Enter a valid 10 digit Indian mobile number';
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return 'Enter a valid email address';
  }

  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
    return 'Enter PAN in format ABCDE1234F';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
}

type Props = {
  screen: ScreenSpec;
  onBack: () => void;
  onNavigate: (screenId: number) => void;
  onLogout?: () => void;
};

export function BaseSpecScreen({ screen, onBack, onNavigate, onLogout }: Props) {
  const { theme, mode, setMode } = useTheme();
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ symbol: string; companyName: string; ltp: number; changePercent: number }>>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [indices, setIndices] = useState<Array<{ symbol: string; ltp: number; changePercent: number }>>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [typedTitle, setTypedTitle] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'VERIFYING' | 'VERIFIED'>('PENDING');
  Object.assign(colors, theme.colors);
  styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  useEffect(() => {
    isBiometricLoginEnabled().then(setBiometricEnabled);
    AsyncStorage.getItem('tradeiq.kyc.status').then(savedStatus => {
      if (savedStatus === 'VERIFIED') {
        setKycStatus('VERIFIED');
      }
    });
  }, []);

  useEffect(() => {
    if (screen.id !== 9) {
      setTypedTitle(screenTitle(screen.name));
      return;
    }

    const title = 'TradeIQ';
    setTypedTitle('');
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTypedTitle(title.slice(0, index));
      if (index >= title.length) {
        clearInterval(timer);
      }
    }, 90);

    return () => clearInterval(timer);
  }, [screen.id, screen.name]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setDataLoading(true);
      try {
        const [dashboardData, profileData, indexData, intelligenceData] = await Promise.all([
          getDashboardData(),
          getProfileData(),
          getMarketIndices(),
          getIntelligenceOverview(),
        ]);

        if (mounted) {
          setDashboard(dashboardData);
          setProfile(profileData);
          setIndices(indexData);
          setIntelligence(intelligenceData);
        }
      } catch {
        if (mounted) {
          showToast('Unable to load live app data');
        }
      } finally {
        if (mounted) {
          setDataLoading(false);
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
        const validationError = validateLoginForm(formState);
        if (validationError) {
          showToast(validationError);
          return;
        }

        const user = await loginWithPassword(
          formState['Mobile or Email'] ?? '',
          formState.Password ?? '',
        );
        showToast(`Welcome ${user.fullName}`);
        registerFcmToken().catch(() => undefined);
        onNavigate(9);
        return;
      }

      if (screen.id === 4 && action.toLowerCase() === 'create account') {
        const validationError = validateRegisterForm(formState);
        if (validationError) {
          showToast(validationError);
          return;
        }

        const user = await registerWithPassword({
          fullName: (formState['Full name'] ?? '').trim(),
          mobile: (formState.Mobile ?? '').trim(),
          email: (formState.Email ?? '').trim(),
          panNumber: (formState.PAN ?? '').trim().toUpperCase(),
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
      showToast(getApiErrorMessage(error, `${action} failed`));
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
      registerFcmToken().catch(() => undefined);
      onNavigate(9);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404 &&
        (error.response.data?.code === 'ACCOUNT_REQUIRED' ||
          String(error.config?.url ?? '').includes('google-login'))
      ) {
        showToast('Create your account before using Google sign-in');
        onNavigate(4);
        return;
      }
      showToast(getApiErrorMessage(error, 'Google sign-in failed'));
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        <ScrollView
          contentContainerStyle={styles.loginContent}
          keyboardShouldPersistTaps="handled"
        >
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
      </KeyboardAvoidingView>
    );
  }

  if (screen.id === 4) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        <ScrollView
          contentContainerStyle={styles.registerContent}
          keyboardShouldPersistTaps="handled"
        >
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
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        {screen.id === 9 ? (
          <Image source={tradeIqLogo} style={styles.headerLogo} resizeMode="contain" />
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ChevronLeft color={colors.textStrong} size={30} strokeWidth={3} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, screen.id === 9 && styles.brandHeaderTitle]}>
          {typedTitle}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate(28)}>
            <BellIcon color={colors.textStrong} size={20} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {dataLoading ? (
          <SkeletonScreen compact={screen.id !== 9} />
        ) : (
          <>
            <Hero screen={screen} dashboard={dashboard} />

            {renderScreenBody(
              screen,
              formState,
              setFormState,
              results,
              onNavigate,
              handleFcmSetup,
              dashboard,
              setDashboard,
              profile,
              indices,
              intelligence,
              onLogout,
              mode,
              setMode,
              biometricEnabled,
              async nextEnabled => {
                if (nextEnabled) {
                  try {
                    const verified = await promptBiometricLogin('Enable biometric login for TradeIQ');
                    if (!verified) {
                      showToast('Biometric verification cancelled');
                      return;
                    }
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Biometric setup failed');
                    return;
                  }
                }
                await setBiometricLoginEnabled(nextEnabled);
                setBiometricEnabled(nextEnabled);
                showToast(nextEnabled ? 'Biometric login enabled' : 'Biometric login disabled');
              },
              kycStatus,
              () => {
                if (kycStatus !== 'PENDING') {
                  return;
                }
                setKycStatus('VERIFYING');
                showToast('KYC verification started');
                setTimeout(() => {
                  setKycStatus('VERIFIED');
                  AsyncStorage.setItem('tradeiq.kyc.status', 'VERIFIED');
                  showToast('KYC verified');
                }, 1400);
              },
            )}
          </>
        )}

        {![9, 11, 13].includes(screen.id) ? (
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
        ) : null}

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
        <Text style={styles.heroLabel}>{screen.id === 9 ? 'TradeIQ' : screenTitle(screen.name)}</Text>
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

function SkeletonScreen({ compact }: { compact?: boolean }) {
  return (
    <>
      <View style={styles.skeletonHero}>
        <View style={[styles.skeletonBlock, styles.skeletonSmall]} />
        <View style={[styles.skeletonBlock, styles.skeletonLarge]} />
      </View>
      {!compact ? (
        <>
          <View style={styles.skeletonGrid}>
            <View style={[styles.skeletonBlock, styles.skeletonTile]} />
            <View style={[styles.skeletonBlock, styles.skeletonTile]} />
          </View>
          <View style={styles.skeletonCard}>
            <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
            <View style={[styles.skeletonBlock, styles.skeletonLine]} />
            <View style={[styles.skeletonBlock, styles.skeletonLine]} />
            <View style={[styles.skeletonBlock, styles.skeletonLineShort]} />
          </View>
          <View style={styles.skeletonGrid}>
            <View style={[styles.skeletonBlock, styles.skeletonTallTile]} />
            <View style={[styles.skeletonBlock, styles.skeletonTallTile]} />
          </View>
          <View style={styles.skeletonCard}>
            <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
            <View style={[styles.skeletonBlock, styles.skeletonLine]} />
            <View style={[styles.skeletonBlock, styles.skeletonLine]} />
          </View>
        </>
      ) : (
        <View style={styles.skeletonCard}>
          <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
          <View style={[styles.skeletonBlock, styles.skeletonLine]} />
          <View style={[styles.skeletonBlock, styles.skeletonLine]} />
          <View style={[styles.skeletonBlock, styles.skeletonLineShort]} />
        </View>
      )}
    </>
  );
}

function renderScreenBody(
  screen: ScreenSpec,
  formState: Record<string, string>,
  setFormState: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  results: Array<{ symbol: string; companyName: string; ltp: number; changePercent: number }>,
  onNavigate: (screenId: number) => void,
  handleFcmSetup: () => void,
  dashboard: DashboardData | null,
  setDashboard: React.Dispatch<React.SetStateAction<DashboardData | null>>,
  profile: ProfileData | null,
  indices: Array<{ symbol: string; ltp: number; changePercent: number }>,
  intelligence: IntelligenceData | null,
  onLogout?: () => void,
  themeMode?: ThemeMode,
  setThemeMode?: (mode: ThemeMode) => void,
  biometricEnabled?: boolean,
  onBiometricToggle?: (enabled: boolean) => void,
  kycStatus?: 'PENDING' | 'VERIFYING' | 'VERIFIED',
  onKycVerify?: () => void,
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
        <DashboardQuickTrade onNavigate={onNavigate} />
        <PortfolioGraph dashboard={dashboard} />
        <RiskSummary />
        <IntelligenceHub intelligence={intelligence} onNavigate={onNavigate} />
        <IndicesStrip indices={indices} />
        <MarketList onNavigate={onNavigate} watchlist={dashboard?.watchlist ?? []} />
        <OrderList orders={dashboard?.orders ?? []} />
      </>
    );
  }

  if (screen.id === 10) {
    return <MarketList onNavigate={onNavigate} watchlist={dashboard?.watchlist ?? []} />;
  }

  if (screen.id === 11) {
    return (
      <WalletScreen
        formState={formState}
        setFormState={setFormState}
        dashboard={dashboard}
        setDashboard={setDashboard}
      />
    );
  }

  if (screen.id === 20) {
    return <HoldingsList onNavigate={onNavigate} holdings={dashboard?.holdings ?? []} />;
  }

  if (screen.id === 12) {
    return <OrderList orders={dashboard?.orders ?? []} />;
  }

  if (screen.id === 21) {
    return <PortfolioHealthScreen intelligence={intelligence} />;
  }

  if (screen.id === 22) {
    return <AiRecommendationScreen intelligence={intelligence} />;
  }

  if (screen.id === 23) {
    return <SmartRiskScreen intelligence={intelligence} />;
  }

  if (screen.id === 24) {
    return <EmotionalTradingScreen intelligence={intelligence} />;
  }

  if (screen.id === 25) {
    return <PredictiveAlertsScreen intelligence={intelligence} />;
  }

  if (screen.id === 26) {
    return <PaperTradingScreen intelligence={intelligence} />;
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
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.detailLabel}>Biometric Login</Text>
              <Text style={styles.mutedText}>Require device biometric when reopening TradeIQ</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleTrack, biometricEnabled && styles.toggleTrackActive]}
              onPress={() => onBiometricToggle?.(!biometricEnabled)}
            >
              <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.detailLabel}>KYC Status</Text>
              <Text style={kycStatus === 'VERIFIED' ? styles.positive : styles.mutedText}>
                {kycStatus === 'VERIFIED' ? 'Verified' : kycStatus === 'VERIFYING' ? 'Verifying...' : 'Pending'}
              </Text>
            </View>
            {kycStatus !== 'VERIFIED' ? (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={onKycVerify}
                disabled={kycStatus === 'VERIFYING'}
              >
                <Text style={styles.verifyButtonText}>
                  {kycStatus === 'VERIFYING' ? 'Checking' : 'Verify'}
                </Text>
              </TouchableOpacity>
            ) : (
              <ShieldCheck color={colors.buy} size={26} strokeWidth={2.5} />
            )}
          </View>
          <DetailRow label="Study Group" value={profile?.studyGroup ?? 'Loading...'} />
        </View>

        <SectionLabel title="Appearance" />
        <View style={styles.detailCard}>
          <Text style={styles.mutedText}>Choose the color mode for TradeIQ on this device.</Text>
          <View style={styles.themeSwitchRow}>
            {(['system', 'dark', 'light'] as ThemeMode[]).map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.themeChip, themeMode === item && styles.activeThemeChip]}
                onPress={() => setThemeMode?.(item)}
              >
                <Text style={[styles.themeChipText, themeMode === item && styles.activeThemeChipText]}>
                  {item === 'system' ? 'System' : item === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.detailCard}>
          <SupportLink Icon={HelpCircle} title="Help and Support" />
          <SupportLink Icon={ShieldCheck} title="Privacy Policy" />
          <SupportLink Icon={FileText} title="Terms and Conditions" />
        </View>
        <TouchableOpacity
          style={styles.profileLogoutButton}
          onPress={() => {
            showToast('Logged out');
            onLogout?.();
          }}
        >
          <Text style={styles.profileLogoutText}>Logout</Text>
        </TouchableOpacity>
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
      <>
        <AiChatAssistant intelligence={intelligence} />
        <VoiceAssistant intelligence={intelligence} />
        <View style={styles.card}>
          <TouchableOpacity style={styles.secondaryWideButton} onPress={handleFcmSetup}>
            <Text style={styles.secondaryWideText}>Enable Push Notifications</Text>
          </TouchableOpacity>
        </View>
      </>
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

function PortfolioGraph({ dashboard }: { dashboard: DashboardData | null }) {
  const invested = parseInr(dashboard?.summary.invested);
  const current = parseInr(dashboard?.summary.current);
  const maxValue = Math.max(invested, current, 1);
  const investedWidth = `${Math.max(8, (invested / maxValue) * 100)}%` as const;
  const currentWidth = `${Math.max(8, (current / maxValue) * 100)}%` as const;
  const gain = current - invested;

  return (
    <View style={styles.analyticsCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Portfolio trend</Text>
        <Text style={gain >= 0 ? styles.positive : styles.negative}>
          {gain >= 0 ? '+' : '-'}INR {Math.abs(gain).toLocaleString('en-IN')}
        </Text>
      </View>

      <View style={styles.graphTrack}>
        <View style={[styles.graphFill, styles.investedFill, { width: investedWidth }]} />
      </View>
      <View style={styles.graphLabelRow}>
        <Text style={styles.mutedText}>Invested</Text>
        <Text style={styles.price}>{dashboard?.summary.invested ?? 'INR 0'}</Text>
      </View>

      <View style={styles.graphTrack}>
        <View style={[styles.graphFill, styles.currentFill, { width: currentWidth }]} />
      </View>
      <View style={styles.graphLabelRow}>
        <Text style={styles.mutedText}>Current</Text>
        <Text style={styles.price}>{dashboard?.summary.current ?? 'INR 0'}</Text>
      </View>
    </View>
  );
}

function RiskSummary() {
  return (
    <View style={styles.riskGrid}>
      <View style={styles.riskCard}>
        <Text style={styles.tileTitle}>Allocation</Text>
        <View style={styles.donutOuter}>
          <View style={styles.donutInner}>
            <Text style={styles.donutText}>EQ</Text>
          </View>
        </View>
        <Text style={styles.mutedText}>Equity focused</Text>
      </View>
      <View style={styles.riskCard}>
        <Text style={styles.tileTitle}>Risk meter</Text>
        <View style={styles.meterTrack}>
          <View style={styles.meterLow} />
          <View style={styles.meterMid} />
          <View style={styles.meterHigh} />
        </View>
        <Text style={styles.tileValue}>Moderate</Text>
      </View>
    </View>
  );
}

function IntelligenceHub({
  intelligence,
  onNavigate,
}: {
  intelligence: IntelligenceData | null;
  onNavigate: (screenId: number) => void;
}) {
  const items = [
    { title: 'Health', value: `${intelligence?.portfolioHealth.score ?? 0}/100`, screenId: 21 },
    { title: 'AI Advice', value: intelligence?.aiRecommendation.title ?? 'Loading', screenId: 22 },
    { title: 'Risk', value: intelligence?.risk.level ?? 'Loading', screenId: 23 },
    { title: 'Behaviour', value: intelligence?.emotionalTrading.status ?? 'Loading', screenId: 24 },
    { title: 'Predict', value: `${intelligence?.predictiveAlerts.length ?? 0} alerts`, screenId: 25 },
    { title: 'Paper', value: intelligence?.paperTrading.enabled ? 'Enabled' : 'Ready', screenId: 26 },
    { title: 'AI Chat', value: 'Assistant', screenId: 28 },
    { title: 'Voice', value: 'Commands', screenId: 28 },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>TradeIQ intelligence</Text>
        <Text style={styles.statusPill}>8 features</Text>
      </View>
      <View style={styles.featureGrid}>
        {items.map(item => (
          <TouchableOpacity
            key={item.title}
            style={styles.featureTile}
            onPress={() => onNavigate(item.screenId)}
          >
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureValue}>{item.value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PortfolioHealthScreen({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="Portfolio Health Score"
      metric={`${intelligence?.portfolioHealth.score ?? 0}/100`}
      subtitle={intelligence?.portfolioHealth.label ?? 'Analysing'}
      items={intelligence?.portfolioHealth.drivers ?? []}
    />
  );
}

function AiRecommendationScreen({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="AI Portfolio Recommendation"
      metric={intelligence?.aiRecommendation.title ?? 'Analysing'}
      subtitle="Allocation and diversification suggestions"
      items={intelligence?.aiRecommendation.suggestions ?? []}
    />
  );
}

function SmartRiskScreen({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="Smart Risk Score"
      metric={`${intelligence?.risk.level ?? 'Loading'} risk`}
      subtitle={`Score ${intelligence?.risk.score ?? 0}/100`}
      items={intelligence?.risk.factors ?? []}
    />
  );
}

function EmotionalTradingScreen({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="Emotional Trading Detection"
      metric={intelligence?.emotionalTrading.status ?? 'Analysing'}
      subtitle={intelligence?.emotionalTrading.coaching ?? 'Behaviour coaching'}
      items={intelligence?.emotionalTrading.signals ?? []}
    />
  );
}

function PredictiveAlertsScreen({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Predictive Market Alerts</Text>
      {(intelligence?.predictiveAlerts ?? []).map(alert => (
        <View key={alert.title} style={styles.insightRow}>
          <View>
            <Text style={styles.symbol}>{alert.title}</Text>
            <Text style={styles.mutedText}>{alert.message}</Text>
          </View>
          <Text style={styles.statusPill}>{alert.severity}</Text>
        </View>
      ))}
    </View>
  );
}

function PaperTradingScreen({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="Paper Trading Mode"
      metric={`INR ${(intelligence?.paperTrading.balance ?? 0).toLocaleString('en-IN')}`}
      subtitle={intelligence?.paperTrading.message ?? 'Practice without risk'}
      items={['Virtual balance', 'Order preview', 'No real capital risk']}
    />
  );
}

function AiChatAssistant({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="AI Chat Assistant"
      metric="Ask TradeIQ"
      subtitle="Market education and portfolio guidance"
      items={intelligence?.aiAssistant.prompts ?? []}
    />
  );
}

function VoiceAssistant({ intelligence }: { intelligence: IntelligenceData | null }) {
  return (
    <FeaturePanel
      title="Voice Trading Assistant"
      metric="Voice commands"
      subtitle={intelligence?.voiceAssistant.safety ?? 'Requires confirmation'}
      items={intelligence?.voiceAssistant.examples ?? []}
    />
  );
}

function FeaturePanel({
  title,
  metric,
  subtitle,
  items,
}: {
  title: string;
  metric: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.featureHeroMetric}>{metric}</Text>
      <Text style={styles.mutedText}>{subtitle}</Text>
      <View style={styles.insightList}>
        {items.length === 0 ? <EmptyState title="Insights will appear after more activity" /> : null}
        {items.map(item => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.insightText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function parseInr(value?: string) {
  return Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;
}

function WalletScreen({
  formState,
  setFormState,
  dashboard,
  setDashboard,
}: {
  formState: Record<string, string>;
  setFormState: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  dashboard: DashboardData | null;
  setDashboard: React.Dispatch<React.SetStateAction<DashboardData | null>>;
}) {
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
  const amount = formState.Amount ?? '';
  const walletBalance = dashboard?.wallet?.balance;
  const formattedAvailable =
    typeof walletBalance === 'number'
      ? `INR ${walletBalance.toLocaleString('en-IN')}`
      : walletBalance ?? dashboard?.wallet?.formattedBalance ?? 'INR 0';

  const setAmount = (value: string) => {
    setFormState(currentState => ({ ...currentState, Amount: value.replace(/[^0-9]/g, '') }));
  };

  const handleWalletAction = async (action: 'add' | 'withdraw') => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 100) {
      showToast('Enter an amount of INR 100 or more');
      return;
    }

    if (action === 'withdraw') {
      showToast('Withdrawals will be enabled with broker ledger integration');
      return;
    }

    try {
      setPaymentState('processing');
      await new Promise<void>(resolve => setTimeout(resolve, 1400));
      const result = await addWalletFunds(numericAmount);
      setDashboard(currentDashboard =>
        currentDashboard
          ? {
              ...currentDashboard,
              wallet: {
                balance: result.wallet.formattedBalance ?? result.wallet.balance ?? formattedAvailable,
                transactions: result.wallet.transactions,
              },
            }
          : currentDashboard,
      );
      setPaymentState('success');
      setAmount('');
      showToast(`INR ${numericAmount.toLocaleString('en-IN')} added to paper wallet`);
      setTimeout(() => setPaymentState('idle'), 1700);
    } catch (error) {
      setPaymentState('idle');
      showToast(getApiErrorMessage(error, 'Unable to add funds'));
    }
  };

  return (
    <>
      <Modal visible={paymentState !== 'idle'} animationType="fade">
        <View style={styles.paymentModal}>
          {paymentState === 'processing' ? (
            <>
              <View style={styles.paymentIconCircle}>
                <CreditCard color={colors.accent} size={38} strokeWidth={2.5} />
              </View>
              <ActivityIndicator color={colors.buy} size="large" style={styles.paymentSpinner} />
              <Text style={styles.paymentTitle}>Processing payment</Text>
              <Text style={styles.paymentText}>Adding INR {Number(amount || 0).toLocaleString('en-IN')} to your paper wallet</Text>
            </>
          ) : (
            <>
              <View style={[styles.paymentIconCircle, styles.paymentSuccessCircle]}>
                <CheckCircle2 color={colors.bg} size={46} strokeWidth={2.8} />
              </View>
              <Text style={styles.paymentTitle}>Payment successful</Text>
              <Text style={styles.paymentText}>Amount added to your TradeIQ paper wallet</Text>
            </>
          )}
        </View>
      </Modal>

      <View style={styles.walletBalanceCard}>
        <Text style={styles.walletBalanceLabel}>Trading balance</Text>
        <Text style={styles.walletBalanceValue}>{formattedAvailable}</Text>
        <View style={styles.walletMetaRow}>
          <Text style={styles.mutedText}>Invested {dashboard?.summary.invested ?? 'INR 0'}</Text>
          <Text style={styles.positive}>Portfolio {dashboard?.summary.current ?? 'INR 0'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add amount to trade</Text>
        <TextInput
          placeholder="Enter amount"
          placeholderTextColor={colors.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          style={styles.amountInput}
        />
        <View style={styles.quickAmountRow}>
          {['1000', '5000', '10000', '25000'].map(value => (
            <TouchableOpacity key={value} style={styles.quickAmountChip} onPress={() => setAmount(value)}>
              <Text style={styles.quickAmountText}>INR {Number(value).toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.walletActionRow}>
          <TouchableOpacity style={styles.walletPrimaryButton} onPress={() => handleWalletAction('add')}>
            <Text style={styles.primaryButtonText}>Add funds</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletSecondaryButton} onPress={() => handleWalletAction('withdraw')}>
            <Text style={styles.walletSecondaryText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoTile title="Payment gateway" value="Pending" />
        <InfoTile title="Broker ledger" value="Pending" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transaction history</Text>
        {!dashboard?.wallet?.transactions?.length ? <EmptyState title="No wallet transactions yet" /> : null}
        {dashboard?.wallet?.transactions?.map(transaction => (
          <View key={transaction.referenceId} style={styles.listRow}>
            <View>
              <Text style={styles.symbol}>{transaction.type === 'CREDIT' ? 'Funds added' : 'Withdrawal'}</Text>
              <Text style={styles.mutedText}>{transaction.referenceId}</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={transaction.type === 'CREDIT' ? styles.positive : styles.negative}>
                {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount}
              </Text>
              <Text style={styles.statusPill}>{transaction.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
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

function DashboardQuickTrade({ onNavigate }: { onNavigate: (screenId: number) => void }) {
  return (
    <View style={styles.quickTradeCard}>
      <TouchableOpacity style={styles.searchBarButton} onPress={() => onNavigate(14)}>
        <Text style={styles.searchBarText}>Search stocks, indices or ETFs</Text>
      </TouchableOpacity>
      <View style={styles.quickTradeActions}>
        <TouchableOpacity style={styles.buyActionButton} onPress={() => onNavigate(16)}>
          <Text style={styles.quickTradeText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sellActionButton} onPress={() => onNavigate(17)}>
          <Text style={styles.quickTradeText}>Sell</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SupportLink({
  Icon,
  title,
}: {
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  title: string;
}) {
  return (
    <TouchableOpacity style={styles.supportRow} onPress={() => showToast(`${title} will open soon`)}>
      <View style={styles.supportIcon}>
        <Icon color={colors.primary} size={20} strokeWidth={2.4} />
      </View>
      <Text style={styles.supportTitle}>{title}</Text>
      <ChevronLeft color={colors.muted} size={20} style={styles.supportChevron} />
    </TouchableOpacity>
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
    { label: 'Home', Icon: HomeIcon, screenId: 9 },
    { label: 'Holdings', Icon: BarChart3, screenId: 20 },
    { label: 'Trade', Icon: Repeat2, screenId: 14 },
    { label: 'Wallet', Icon: Wallet, screenId: 11 },
    { label: 'Alerts', Icon: BellIcon, screenId: 27 },
    { label: 'Profile', Icon: User, screenId: 13 },
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map(tab => {
        const active = tab.screenId === activeScreenId;
        const iconColor = active ? colors.accent : colors.muted;
        const Icon = tab.Icon;
        return (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tabItem, active && styles.activeTabItem]}
            onPress={() => onNavigate(tab.screenId)}
          >
            <Icon color={iconColor} size={22} strokeWidth={active ? 2.8 : 2.2} />
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

let styles = createStyles(colors);

// Keeps the large screen stylesheet tokenized without rewriting every style key.
// eslint-disable-next-line @typescript-eslint/no-shadow
function createStyles(colors: TradeIQColors) {
return StyleSheet.create({
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
  backSpacer: {
    width: 40,
  },
  headerLogo: {
    height: 40,
    width: 72,
  },
  backIcon: { color: colors.textStrong, fontSize: 34, fontWeight: '400' },
  headerTitle: {
    color: colors.textStrong,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  brandHeaderTitle: {
    fontSize: 24,
    letterSpacing: 0,
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
    width: 44,
  },
  iconButtonText: {
    color: colors.textStrong,
    fontSize: 12,
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
  registerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 44,
    paddingTop: 18,
  },
  authLogo: {
    alignSelf: 'center',
    height: 104,
    marginBottom: 16,
    width: 210,
  },
  authPanel: {
    backgroundColor: colors.surface,
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
  skeletonHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skeletonBlock: {
    backgroundColor: colors.skeleton,
    borderRadius: 8,
    opacity: 0.72,
  },
  skeletonSmall: {
    height: 16,
    marginBottom: 18,
    width: 86,
  },
  skeletonLarge: {
    height: 36,
    width: '68%',
  },
  skeletonTile: {
    flex: 1,
    height: 104,
  },
  skeletonTallTile: {
    flex: 1,
    height: 190,
  },
  skeletonTitle: {
    height: 24,
    marginBottom: 18,
    width: '52%',
  },
  skeletonLine: {
    height: 16,
    marginBottom: 14,
    width: '100%',
  },
  skeletonLineShort: {
    height: 16,
    width: '62%',
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
  quickTradeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  searchBarButton: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchBarText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  quickTradeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  buyActionButton: {
    alignItems: 'center',
    backgroundColor: colors.buy,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 15,
  },
  sellActionButton: {
    alignItems: 'center',
    backgroundColor: colors.sell,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 15,
  },
  quickTradeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  inputGroup: { marginBottom: 14 },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.textStrong,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  amountInput: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textStrong,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  walletBalanceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  walletBalanceLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  walletBalanceValue: {
    color: colors.textStrong,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  walletMetaRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  quickAmountChip: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickAmountText: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '900',
  },
  walletActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  walletPrimaryButton: {
    alignItems: 'center',
    backgroundColor: colors.buy,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 15,
  },
  walletSecondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 15,
  },
  walletSecondaryText: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '900',
  },
  paymentModal: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  paymentIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  paymentSuccessCircle: {
    backgroundColor: colors.buy,
    borderColor: colors.buy,
  },
  paymentSpinner: {
    marginTop: 24,
  },
  paymentTitle: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 24,
    textAlign: 'center',
  },
  paymentText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.buy,
    borderRadius: 10,
    marginTop: 6,
    paddingVertical: 15,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 15,
  },
  googleIcon: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  googleText: { color: colors.textStrong, fontSize: 16, fontWeight: '900' },
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
  analyticsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  graphTrack: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 999,
    height: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  graphFill: {
    borderRadius: 999,
    height: 12,
  },
  investedFill: {
    backgroundColor: colors.primary,
  },
  currentFill: {
    backgroundColor: colors.buy,
  },
  graphLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  riskGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  riskCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  donutOuter: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.buy,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    marginVertical: 12,
    width: 84,
  },
  donutInner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  donutText: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  meterTrack: {
    borderRadius: 999,
    flexDirection: 'row',
    height: 12,
    marginBottom: 18,
    marginTop: 28,
    overflow: 'hidden',
  },
  meterLow: {
    backgroundColor: colors.buy,
    flex: 1,
  },
  meterMid: {
    backgroundColor: colors.warning,
    flex: 1,
  },
  meterHigh: {
    backgroundColor: colors.sell,
    flex: 1,
  },
  indicesScroller: {
    marginBottom: 16,
  },
  indexCard: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface2,
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
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureTile: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 76,
    minWidth: '46%',
    padding: 12,
  },
  featureTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  featureValue: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  featureHeroMetric: {
    color: colors.buy,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
  },
  insightList: {
    marginTop: 16,
  },
  insightRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  bulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  bulletDot: {
    backgroundColor: colors.buy,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  insightText: {
    color: colors.textStrong,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
    backgroundColor: colors.tabBg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 56,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  activeTabItem: {
    backgroundColor: colors.surface2,
  },
  tabIcon: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  activeTabText: {
    color: colors.accent,
  },
  themeSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  themeChip: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  activeThemeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  activeThemeChipText: {
    color: '#FFFFFF',
  },
  settingRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  toggleTrack: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 58,
  },
  toggleTrackActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleThumb: {
    backgroundColor: colors.muted,
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  supportRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 15,
  },
  supportIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  supportTitle: {
    color: colors.textStrong,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  supportChevron: {
    transform: [{ rotate: '180deg' }],
  },
  profileLogoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,77,77,0.14)',
    borderColor: 'rgba(255,77,77,0.28)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    paddingVertical: 15,
  },
  profileLogoutText: {
    color: colors.sell,
    fontSize: 16,
    fontWeight: '900',
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    lineHeight: 22,
    textAlign: 'right',
  },
});
}
