import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const MOCK_HISTORY = [
  { id: '1', date: 'Today, 10:30 AM', skill: 'Grammar', icon: 'book', topic: 'Present Tenses', score: 80, duration: '5:20', questions: 10 },
  { id: '2', date: 'Yesterday, 2:15 PM', skill: 'Vocabulary', icon: 'text', topic: 'Business English', score: 60, duration: '4:15', questions: 5 },
  { id: '3', date: 'Oct 12, 9:00 AM', skill: 'Reading', icon: 'newspaper', topic: 'News Articles', score: 100, duration: '8:45', questions: 5 },
  { id: '4', date: 'Oct 10, 8:30 PM', skill: 'Writing', icon: 'pencil', topic: 'Formal Emails', score: 75, duration: '12:30', questions: 2 },
];

const SKILL_FILTERS = ['All', 'Grammar', 'Vocabulary', 'Reading', 'Writing', 'Speaking'];

const HistoryScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('All');

  const filteredHistory = filter === 'All' 
    ? MOCK_HISTORY 
    : MOCK_HISTORY.filter(h => h.skill === filter);

  const renderItem = ({ item }) => (
    <Card 
      style={styles.historyCard} 
      onPress={() => navigation.navigate('HistoryDetail', { session: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.skillIconContainer}>
          <Ionicons name={item.icon} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.topicText}>{item.topic}</Text>
          <Text style={styles.dateText}>{item.date} • {item.skill}</Text>
        </View>
        <Badge 
          text={`${item.score}%`} 
          variant={item.score >= 80 ? 'success' : item.score >= 60 ? 'warning' : 'error'} 
        />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{item.duration}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="list-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{item.questions} Qs</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Practice History" showBack />
      
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SKILL_FILTERS}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.filterTab, filter === item && styles.filterTabActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No history found for this skill.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  filterList: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  historyCard: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  skillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
  },
  topicText: {
    ...FONTS.regular,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  }
});

export default HistoryScreen;
