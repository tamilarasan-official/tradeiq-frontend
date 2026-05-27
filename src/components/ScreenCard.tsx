import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import type { ScreenSpec } from '../types/screens';
import { StatusBadge } from './StatusBadge';

export function ScreenCard({
  screen,
  selected,
  onPress,
}: {
  screen: ScreenSpec;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={styles.header}>
        <Text style={styles.number}>SCREEN {String(screen.id).padStart(2, '0')}</Text>
        <StatusBadge label={screen.category} />
      </View>
      <Text style={styles.name}>{screen.name}</Text>
      <Text style={styles.route}>{screen.route}</Text>
      <Text style={styles.summary}>{screen.summary}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: '#172033',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  number: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  name: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '900',
  },
  route: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  summary: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
});
