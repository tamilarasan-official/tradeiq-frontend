import React, { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { clearBackendSession } from '../services/api';
import { colors } from '../theme/colors';
import { screenRegistry } from './specScreens';

const store = configureStore({ reducer: {} });

export default function TradeIQApp() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <MobileShell />
        </SafeAreaView>
      </SafeAreaProvider>
    </Provider>
  );
}

function MobileShell() {
  const [currentScreenId, setCurrentScreenId] = useState(5);
  const [_history, setHistory] = useState<number[]>([]);
  const ActiveScreen = screenRegistry[currentScreenId] ?? screenRegistry[5];

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

  function logout() {
    clearBackendSession();
    setHistory([]);
    setCurrentScreenId(5);
  }

  return <ActiveScreen onBack={goBack} onNavigate={navigate} onLogout={logout} />;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
});
