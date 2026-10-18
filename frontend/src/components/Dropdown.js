import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

// A drop-down that works the same on phones and the web: tap the field, pick from a searchable list.
// options: array of strings. onChange(value) gets '' when the person chooses the "clear" row.
const Dropdown = ({ label, value, options, onChange, placeholder = 'Select', searchable = true, selectOnSubmit = false, autoFocusSearch = false, searchKeyboardType, clearLabel, required, optional, sheetTitle }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((option) => option.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (next) => {
    onChange(next);
    close();
  };

  const submitSearch = (submittedQuery = query) => {
    const normalizedQuery = (submittedQuery || '').trim().toLowerCase();
    if (!normalizedQuery) return;
    const exactMatch = options.find((option) => option.toLowerCase() === normalizedQuery);
    const next = exactMatch || (filtered.length === 1 ? filtered[0] : null);
    if (next) choose(next);
  };

  const renderRow = (text, selected, onPress, muted) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.rowText, muted && styles.rowMuted, selected && styles.rowSelected]}>{text}</Text>
      {selected && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
          {optional ? <Text style={styles.optionalMark}> (optional)</Text> : null}
        </Text>
      )}
      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${sheetTitle || label || 'Select'}: ${value || placeholder}`}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={close}>
          {/* The inner touchable swallows taps so only the dark area closes the list. */}
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{sheetTitle || label || 'Select'}</Text>
              <TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                autoFocus={autoFocusSearch}
                keyboardType={searchKeyboardType}
                placeholder="Search..."
                placeholderTextColor={COLORS.textLight}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType={selectOnSubmit ? 'done' : 'default'}
                onSubmitEditing={selectOnSubmit ? ({ nativeEvent }) => submitSearch(nativeEvent.text) : undefined}
              />
            )}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListHeaderComponent={
                clearLabel && !query ? renderRow(clearLabel, !value, () => choose(''), true) : null
              }
              renderItem={({ item }) => renderRow(item, item === value, () => choose(item))}
              ListEmptyComponent={<Text style={styles.empty}>Nothing matches "{query}".</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.base },
  label: { ...FONTS.small, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  requiredMark: { color: COLORS.error, fontWeight: '700' },
  optionalMark: { color: COLORS.textLight, fontWeight: '400' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
  },
  value: { ...FONTS.regular, color: COLORS.text, flex: 1, paddingRight: SPACING.sm },
  placeholder: { color: COLORS.textLight },
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    ...Platform.select({ web: { cursor: 'default' } }),
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    height: '75%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  sheetTitle: { ...FONTS.h3 },
  search: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
    ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } }),
  },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: { ...FONTS.regular, color: COLORS.text, flex: 1 },
  rowMuted: { color: COLORS.textSecondary },
  rowSelected: { color: COLORS.primary, fontWeight: '600' },
  empty: { ...FONTS.small, textAlign: 'center', marginTop: SPACING.lg },
});

export default Dropdown;
