import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { colors } from '../theme/colors';
import { screenRegistry } from './specScreens';

const store = configureStore({ reducer: {} });

export default function TradeIQApp() {
  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <SafeAreaView style={styles.safeArea}>
        <MobileShell />
      </SafeAreaView>
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

  return <ActiveScreen onBack={goBack} onNavigate={navigate} />;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
});
