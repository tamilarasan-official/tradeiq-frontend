import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'accent';
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          tone === 'positive' && styles.positive,
          tone === 'negative' && styles.negative,
          tone === 'accent' && styles.accent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.surface2,
    borderRadius: 8,
    padding: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  positive: {
    color: colors.buy,
  },
  negative: {
    color: colors.sell,
  },
  accent: {
    color: colors.accent,
  },
});
