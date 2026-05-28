import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { clearBackendSession, restoreBackendSession } from '../services/api';
import { isBiometricLoginEnabled, promptBiometricLogin } from '../services/biometricAuth';
import { colors } from '../theme/colors';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { screenRegistry } from './specScreens';

const store = configureStore({ reducer: {} });

export default function TradeIQApp() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ThemedAppFrame />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}

function ThemedAppFrame() {
  const { theme, resolvedMode } = useTheme();

  Object.assign(colors, theme.colors);

  return (
    <>
      <StatusBar
        barStyle={resolvedMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.bg}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.bg }]} edges={['top', 'left', 'right']}>
        <MobileShell />
      </SafeAreaView>
    </>
  );
}

function MobileShell() {
  const { theme } = useTheme();
  const [currentScreenId, setCurrentScreenId] = useState(5);
  const [booting, setBooting] = useState(true);
  const [_history, setHistory] = useState<number[]>([]);
  const ActiveScreen = screenRegistry[currentScreenId] ?? screenRegistry[5];

  useEffect(() => {
    let mounted = true;

    restoreBackendSession()
      .then(async restored => {
        if (mounted && restored) {
          if (await isBiometricLoginEnabled()) {
            const verified = await promptBiometricLogin();
            if (!verified) {
              await clearBackendSession();
              setCurrentScreenId(5);
              return;
            }
          }
          setCurrentScreenId(9);
        }
      })
      .catch(async () => {
        await clearBackendSession();
        if (mounted) {
          setCurrentScreenId(5);
        }
      })
      .finally(() => {
        if (mounted) {
          setBooting(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function navigate(nextScreenId: number) {
    setHistory(current => [...current, currentScreenId]);
    setCurrentScreenId(nextScreenId);
  }

  function goBack() {
    setHistory(current => {
      const previous = current[current.length - 1];
      if (!previous) {
        return current;
      }
      setCurrentScreenId(previous);
      return current.slice(0, -1);
    });
  }

  async function logout() {
    await clearBackendSession();
    setHistory([]);
    setCurrentScreenId(5);
  }

  if (booting) {
    return <ActivityIndicator color={theme.colors.buy} style={styles.loader} />;
  }

  return <ActiveScreen onBack={goBack} onNavigate={navigate} onLogout={logout} />;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  loader: {
    flex: 1,
  },
});
