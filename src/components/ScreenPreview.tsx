import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { ScreenSpec } from '../types/screens';
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';

export function ScreenPreview({ screen }: { screen: ScreenSpec }) {
  return (
    <View style={styles.preview}>
      <View style={styles.previewTop}>
        <View>
          <Text style={styles.route}>{screen.route}</Text>
          <Text style={styles.title}>{screen.name}</Text>
        </View>
        <StatusBadge label={`#${String(screen.id).padStart(2, '0')}`} tone="positive" />
      </View>

      <Text style={styles.summary}>{screen.summary}</Text>

      {screen.primaryMetric ? (
        <View style={styles.metricRow}>
          <MetricCard label="Primary signal" value={screen.primaryMetric} tone="positive" />
          <MetricCard label="Category" value={screen.category} tone="accent" />
        </View>
      ) : (
        <View style={styles.metricRow}>
          <MetricCard label="Category" value={screen.category} tone="accent" />
          <MetricCard label="Route" value={screen.route.replace('/', '') || 'root'} />
        </View>
      )}

      {screen.fields ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Fields</Text>
          <View style={styles.chipGrid}>
            {screen.fields.map(field => (
              <View key={field} style={styles.fieldChip}>
                <Text style={styles.chipText}>{field}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Screen Layout</Text>
        {screen.sections.map(section => (
          <View key={section} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.rowText}>{section}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionBar}>
        {screen.actions.slice(0, 3).map((action, index) => (
          <View
            key={action}
            style={[
              styles.actionButton,
              index === 0 && styles.primaryAction,
              action.toLowerCase().includes('sell') && styles.sellAction,
            ]}
          >
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  previewTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  route: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: colors.textStrong,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },
  summary: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  panel: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    marginTop: 14,
    padding: 14,
  },
  panelTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 7,
  },
  dot: {
    backgroundColor: colors.buy,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  rowText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldChip: {
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryAction: {
    backgroundColor: colors.buy,
  },
  sellAction: {
    backgroundColor: colors.sell,
  },
  actionText: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '900',
  },
});
