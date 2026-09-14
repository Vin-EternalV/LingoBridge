import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Badge from './Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const DataTable = ({ columns, data, onRowAction, actionLabel = 'Action' }) => {
  return (
    <View style={styles.tableContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {columns.map((col, idx) => (
              <View key={idx} style={[styles.headerCell, { width: col.width || 140 }]}>
                <Text style={styles.headerText}>{col.title}</Text>
              </View>
            ))}
            {onRowAction && (
              <View style={[styles.headerCell, { width: 100 }]}>
                <Text style={styles.headerText}>{actionLabel}</Text>
              </View>
            )}
          </View>

          {/* Data Rows */}
          {data && data.length > 0 ? (
            data.map((row, rIdx) => (
              <View key={rIdx} style={[styles.dataRow, rIdx % 2 === 1 && styles.evenRow]}>
                {columns.map((col, cIdx) => {
                  const val = row[col.key];
                  return (
                    <View key={cIdx} style={[styles.dataCell, { width: col.width || 140 }]}>
                      {col.render ? (
                        col.render(val, row)
                      ) : typeof val === 'boolean' ? (
                        <Badge text={val ? 'Active' : 'Inactive'} variant={val ? 'success' : 'error'} />
                      ) : (
                        <Text style={styles.cellText} numberOfLines={2}>
                          {val !== undefined && val !== null ? String(val) : '-'}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {onRowAction && (
                  <View style={[styles.dataCell, { width: 100 }]}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onRowAction(row)}>
                      <Text style={styles.actionBtnText}>Manage</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No records found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLighter,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  headerCell: {
    paddingHorizontal: SPACING.base,
    justifyContent: 'center',
  },
  headerText: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: COLORS.background,
  },
  dataCell: {
    paddingHorizontal: SPACING.base,
    justifyContent: 'center',
  },
  cellText: {
    ...FONTS.small,
    color: COLORS.text,
  },
  actionBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    ...FONTS.tiny,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  emptyRow: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
});

export default DataTable;
