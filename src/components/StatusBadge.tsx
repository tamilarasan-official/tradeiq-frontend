import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.text, tone !== 'neutral' && styles.strong]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  neutral: {
    backgroundColor: colors.surface2,
  },
  positive: {
    backgroundColor: 'rgba(0,194,139,0.16)',
  },
  negative: {
    backgroundColor: 'rgba(255,77,77,0.16)',
  },
  warning: {
    backgroundColor: 'rgba(245,166,35,0.16)',
  },
  text: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  strong: {
    color: colors.textStrong,
  },
});
