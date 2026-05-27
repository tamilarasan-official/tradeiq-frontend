import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { placePaperOrder, searchStocks } from '../../services/api';
import { registerFcmToken, signInWithGoogle } from '../../services/firebase';
import { colors } from '../../theme/colors';
import type { ScreenSpec } from '../../types/screens';
import { showToast } from '../../utils/toast';

type Props = {
  screen: ScreenSpec;
  onBack: () => void;
  onNavigate: (screenId: number) => void;
};

export function BaseSpecScreen({ screen, onBack, onNavigate }: Props) {
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ symbol: string; companyName: string; ltp: number; changePercent: number }>>([]);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      if (screen.id === 14) {
        const data = await searchStocks(formState['Search query'] || 'RELIANCE');
        setResults(data);
        showToast(`${data.length} stocks found`);
        return;
      }

      if (screen.id === 18 && action.toLowerCase() === 'confirm order') {
        const order = await placePaperOrder({
          userId: '000000000000000000000000',
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
      showToast(`Welcome ${credential.user.displayName ?? 'Investor'}`);
      onNavigate(9);
    } catch (error) {
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
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>TQ</Text>
          </View>
          <Text style={styles.loginTitle}>Welcome back</Text>

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

          {loading ? <ActivityIndicator color={colors.buy} style={styles.loader} /> : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle(screen.name)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Hero screen={screen} />

        {renderScreenBody(screen, formState, setFormState, results, onNavigate, handleFcmSetup)}

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
    </View>
  );
}

function Hero({ screen }: { screen: ScreenSpec }) {
  if ([9, 11, 15, 20, 22, 23, 24].includes(screen.id)) {
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{screenTitle(screen.name)}</Text>
        <Text style={styles.heroValue}>{screen.primaryMetric ?? '+INR 12,420'}</Text>
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
          <InfoTile title="Invested" value="INR 7,90,000" />
          <InfoTile title="Current" value="INR 8,42,500" tone="positive" />
        </View>
        <MarketList onNavigate={onNavigate} />
        <OrderList />
      </>
    );
  }

  if (screen.id === 10) {
    return <MarketList onNavigate={onNavigate} />;
  }

  if ([11, 20].includes(screen.id)) {
    return <HoldingsList onNavigate={onNavigate} />;
  }

  if (screen.id === 12) {
    return <OrderList />;
  }

  if (screen.id === 13) {
    return (
      <View style={styles.grid}>
        <InfoTile title="KYC" value="Pending" />
        <InfoTile title="Study group" value="APP" />
        <InfoTile title="Security" value="Enabled" tone="positive" />
      </View>
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

function MarketList({ onNavigate }: { onNavigate: (screenId: number) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Watchlist</Text>
      {[
        ['RELIANCE', '2,850.00', '+1.20%'],
        ['TCS', '4,025.40', '-0.42%'],
        ['INFY', '1,510.10', '+0.76%'],
      ].map(([symbol, price, change]) => (
        <TouchableOpacity key={symbol} style={styles.listRow} onPress={() => onNavigate(15)}>
          <View>
            <Text style={styles.symbol}>{symbol}</Text>
            <Text style={styles.mutedText}>NSE</Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.price}>{price}</Text>
            <Text style={change.startsWith('+') ? styles.positive : styles.negative}>{change}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HoldingsList({ onNavigate }: { onNavigate: (screenId: number) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Holdings</Text>
      {[
        ['RELIANCE', '10 qty', '+8.3%'],
        ['TCS', '3 qty', '-1.2%'],
        ['INFY', '5 qty', '+4.1%'],
      ].map(([symbol, qty, pnl]) => (
        <TouchableOpacity key={symbol} style={styles.listRow} onPress={() => onNavigate(15)}>
          <View>
            <Text style={styles.symbol}>{symbol}</Text>
            <Text style={styles.mutedText}>{qty}</Text>
          </View>
          <Text style={pnl.startsWith('+') ? styles.positive : styles.negative}>{pnl}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function OrderList() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Orders</Text>
      {[
        ['RELIANCE', 'BUY x 10', 'COMPLETE'],
        ['TCS', 'SELL x 2', 'OPEN'],
        ['INFY', 'BUY x 5', 'PENDING'],
      ].map(([symbol, detail, status]) => (
        <View key={`${symbol}-${status}`} style={styles.listRow}>
          <View>
            <Text style={styles.symbol}>{symbol}</Text>
            <Text style={styles.mutedText}>{detail}</Text>
          </View>
          <Text style={styles.statusPill}>{status}</Text>
        </View>
      ))}
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

function nextScreenForAction(screenId: number, action: string) {
  const key = `${screenId}:${action.toLowerCase()}`;
  const map: Record<string, number> = {
    '4:create account': 3,
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
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backText: { color: colors.textStrong, fontWeight: '900' },
  headerTitle: { color: colors.textStrong, fontSize: 18, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 40 },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
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
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 28,
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
    backgroundColor: colors.surface,
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
    borderRadius: 8,
    marginTop: 6,
    paddingVertical: 15,
  },
  primaryButtonText: { color: colors.bg, fontSize: 16, fontWeight: '900' },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.textStrong,
    borderRadius: 8,
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
  secondaryWideButton: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingVertical: 14,
  },
  secondaryWideText: { color: colors.textStrong, fontWeight: '900' },
  loader: { marginTop: 18 },
});
