import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { placePaperOrder, searchStocks, logResearchEvent } from '../../services/api';
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
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ symbol: string; companyName: string; ltp: number; changePercent: number }>>([]);

  const quickMetrics = useMemo(
    () => buildMetrics(screen),
    [screen],
  );

  async function handlePrimaryAction(action: string) {
    setStatus('');
    setLoading(true);

    try {
      const nextScreenId = nextScreenForAction(screen.id, action);

      if (screen.id === 14) {
        const data = await searchStocks(formState['Search query'] || 'RELIANCE');
        setResults(data);
        setStatus(`Found ${data.length} stocks`);
        showToast(`Found ${data.length} stocks`);
        return;
      }

      if (nextScreenId && !(screen.id === 18 && action.toLowerCase() === 'confirm order')) {
        setStatus(`${action} completed`);
        showToast(`${action} completed`);
        onNavigate(nextScreenId);
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
        setStatus(`Paper order ${order.status}: ${order._id}`);
        showToast(`Order ${order.status}`);
        onNavigate(19);
        return;
      }

      if (screen.category === 'Analytics' || screen.category === 'Onboarding') {
        const event = await logResearchEvent(screen.route, {
          screenId: screen.id,
          action,
        });
        setStatus(`Research event logged: ${event._id}`);
        showToast('Research event logged');
        return;
      }

      setStatus(`${action} completed in prototype mode`);
      showToast(`${action} completed`);
    } catch {
      setStatus(`${action} is ready in UI; backend endpoint needs final data/setup`);
      showToast(`${action} could not complete. Check setup/backend.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setStatus('');
    try {
      const credential = await signInWithGoogle();
      const displayName = credential.user.displayName ?? 'Google user';
      setStatus(`Signed in as ${displayName}`);
      showToast(`Welcome ${displayName}`);
      onNavigate(9);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Sign-In failed.';
      setStatus(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFcmSetup() {
    setLoading(true);
    setStatus('');
    try {
      const token = await registerFcmToken();
      setStatus(`FCM ready: ${token.slice(0, 18)}...`);
      showToast('Push notifications enabled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FCM setup failed.';
      setStatus(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <StatusBadge label={screen.category} tone="positive" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.route}>{screen.route}</Text>
        <Text style={styles.title}>{screen.name}</Text>
        <Text style={styles.summary}>{screen.summary}</Text>

        <View style={styles.metricGrid}>
          {quickMetrics.map(metric => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              tone={metric.tone}
            />
          ))}
        </View>

        {screen.fields ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Inputs</Text>
            {screen.fields.map(field => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{field}</Text>
                <TextInput
                  placeholder={field}
                  placeholderTextColor={colors.muted}
                  value={formState[field] ?? defaultFieldValue(field)}
                  onChangeText={value =>
                    setFormState(current => ({ ...current, [field]: value }))
                  }
                  style={styles.input}
                />
              </View>
            ))}
          </View>
        ) : null}

        {screen.id === 5 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Quick Sign In</Text>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fcmButton}
              onPress={handleFcmSetup}
              disabled={loading}
            >
              <Text style={styles.fcmText}>Enable Push Notifications</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Layout</Text>
          {screen.sections.map(section => (
            <View key={section} style={styles.featureRow}>
              <View style={styles.featureIcon} />
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{section}</Text>
                <Text style={styles.featureText}>
                  {sectionDescription(screen.id, section)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {results.length ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Search Results</Text>
            {results.map(stock => (
              <TouchableOpacity
                key={stock.symbol}
                style={styles.resultRow}
                onPress={() => onNavigate(15)}
              >
                <View>
                  <Text style={styles.resultSymbol}>{stock.symbol}</Text>
                  <Text style={styles.resultCompany}>{stock.companyName}</Text>
                </View>
                <View style={styles.resultRight}>
                  <Text style={styles.resultPrice}>{stock.ltp.toFixed(2)}</Text>
                  <Text style={stock.changePercent >= 0 ? styles.up : styles.down}>
                    {stock.changePercent >= 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.actionGrid}>
          {screen.actions.map(action => (
            <TouchableOpacity
              key={action}
              style={[
                styles.actionButton,
                action.toLowerCase().includes('sell') && styles.sellButton,
              ]}
              onPress={() => handlePrimaryAction(action)}
              disabled={loading}
            >
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navGrid}>
          {relatedScreens(screen.id).map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.navButton}
              onPress={() => onNavigate(item.id)}
            >
              <Text style={styles.navText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={colors.buy} style={styles.loader} /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>
    </View>
  );
}

function buildMetrics(screen: ScreenSpec) {
  const fallback = screen.primaryMetric ?? `${screen.sections.length} sections`;
  return [
    { label: 'Screen', value: String(screen.id).padStart(2, '0'), tone: 'accent' as const },
    { label: 'Primary', value: fallback, tone: 'positive' as const },
  ];
}

function nextScreenForAction(screenId: number, action: string) {
  const key = `${screenId}:${action.toLowerCase()}`;
  const map: Record<string, number> = {
    '1:route to login': 5,
    '1:route to dashboard': 9,
    '2:skip': 5,
    '2:next': 3,
    '2:get started': 4,
    '3:accept': 7,
    '3:decline': 5,
    '4:create account': 3,
    '4:login': 5,
    '5:login': 6,
    '5:use mpin': 9,
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
    '12:view detail': 18,
    '13:settings': 29,
    '15:buy': 16,
    '15:sell': 17,
    '15:set alert': 27,
    '16:preview buy': 18,
    '17:preview sell': 18,
    '18:confirm order': 19,
    '18:edit': 16,
    '19:view orders': 12,
    '19:back to home': 9,
    '20:quick sell': 17,
    '20:view stock': 15,
    '20:set alert': 27,
    '26:complete survey': 25,
    '28:open detail': 12,
    '29:save changes': 13,
    '30:change password': 30,
    '30:reset mpin': 30,
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
    Mobile: '9876543210',
    Email: 'investor@example.com',
    PAN: 'ABCDE1234F',
  };
  return defaults[field] ?? '';
}

function sectionDescription(screenId: number, section: string) {
  if (screenId === 9 && section === 'Watchlist') {
    return 'Live prices are loaded from the backend market endpoint when available.';
  }
  if (screenId === 18) {
    return 'Confirmation logs the research timing metric before order placement.';
  }
  if (screenId >= 24 && screenId <= 26) {
    return 'Research metrics are displayed to the user where appropriate and logged silently.';
  }
  return 'Built as a production screen area ready for API data, validation and navigation.';
}

function relatedScreens(screenId: number) {
  if (screenId < 9) {
    return [
      { id: screenId + 1, label: 'Next setup' },
      { id: 9, label: 'Dashboard' },
    ];
  }
  if (screenId >= 14 && screenId <= 19) {
    return [
      { id: 15, label: 'Stock detail' },
      { id: 18, label: 'Preview' },
      { id: 12, label: 'Orders' },
    ];
  }
  if (screenId >= 20 && screenId <= 23) {
    return [
      { id: 20, label: 'Holdings' },
      { id: 22, label: 'Benchmark' },
      { id: 23, label: 'Diversification' },
    ];
  }
  return [
    { id: 9, label: 'Home' },
    { id: 10, label: 'Markets' },
    { id: 11, label: 'Portfolio' },
  ];
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  topbar: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backText: {
    color: colors.textStrong,
    fontWeight: '900',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  route: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  summary: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  panelTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.textStrong,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  featureRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  featureIcon: {
    backgroundColor: colors.buy,
    borderRadius: 5,
    height: 10,
    marginTop: 4,
    width: 10,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '900',
  },
  featureText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: colors.buy,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sellButton: {
    backgroundColor: colors.sell,
  },
  actionText: {
    color: colors.textStrong,
    fontWeight: '900',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  navButton: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navText: {
    color: colors.text,
    fontWeight: '800',
  },
  resultRow: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 12,
  },
  resultSymbol: {
    color: colors.textStrong,
    fontWeight: '900',
  },
  resultCompany: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultPrice: {
    color: colors.textStrong,
    fontWeight: '900',
  },
  up: {
    color: colors.buy,
    fontWeight: '900',
  },
  down: {
    color: colors.sell,
    fontWeight: '900',
  },
  loader: {
    marginTop: 18,
  },
  status: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.textStrong,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  googleIcon: {
    color: colors.bg,
    fontSize: 18,
    fontWeight: '900',
  },
  googleText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '900',
  },
  fcmButton: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 12,
  },
  fcmText: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
});
