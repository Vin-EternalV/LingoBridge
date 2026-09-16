import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { getHistory } from '../../api/progress';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const icons = { grammar: 'book', vocabulary: 'text', reading: 'newspaper', writing: 'pencil', speaking: 'mic' };
const filters = ['All', 'Grammar', 'Vocabulary', 'Reading', 'Writing', 'Speaking'];
const title = value => value.charAt(0).toUpperCase() + value.slice(1);

const HistoryScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('All'); const [sessions, setSessions] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { try { setLoading(true); setError(''); const response = await getHistory(filter === 'All' ? {} : { skill: filter.toLowerCase() }); setSessions(response.data || []); } catch (e) { setError(e.response?.data?.message || 'Unable to load practice history.'); } finally { setLoading(false); } }, [filter]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const renderItem = ({ item }) => <Card style={styles.card} onPress={() => navigation.navigate('HistoryDetail', { sessionId: item._id })}><View style={styles.header}><Ionicons name={icons[item.skill] || 'book'} size={20} color={COLORS.primary} /><View style={styles.info}><Text style={styles.topic}>{item.topic}</Text><Text style={styles.date}>{new Date(item.createdAt).toLocaleString()} • {title(item.skill)}</Text></View><Badge text={`${item.accuracy || 0}%`} variant={item.accuracy >= 80 ? 'success' : item.accuracy >= 60 ? 'warning' : 'error'} /></View><Text style={styles.meta}>{item.totalQuestions} questions • {item.duration || 0} min • {title(item.status)}</Text></Card>;
  return <SafeAreaView style={styles.safeArea}><Header title="Practice History" showBack /><FlatList horizontal data={filters} keyExtractor={item => item} contentContainerStyle={styles.filters} renderItem={({ item }) => <TouchableOpacity style={[styles.filter, filter === item && styles.active]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.activeText]}>{item}</Text></TouchableOpacity>} /><View style={styles.body}>{loading ? <LoadingSpinner message="Loading practice history..." /> : <FlatList data={sessions} keyExtractor={item => item._id} renderItem={renderItem} onRefresh={load} refreshing={false} ListEmptyComponent={<EmptyState title="No practice sessions yet" message={error || 'Complete a practice session to see it here.'} />} contentContainerStyle={styles.list} />}</View></SafeAreaView>;
};
const styles = StyleSheet.create({safeArea:{flex:1,backgroundColor:COLORS.background},filters:{padding:SPACING.base,gap:SPACING.sm},filter:{paddingHorizontal:SPACING.base,paddingVertical:SPACING.xs,borderRadius:RADIUS.full,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},active:{backgroundColor:COLORS.primaryLight,borderColor:COLORS.primary},filterText:{...FONTS.small,color:COLORS.textSecondary},activeText:{color:COLORS.primaryDark,fontWeight:'600'},body:{flex:1},list:{padding:SPACING.base,paddingBottom:SPACING.xxl},card:{padding:SPACING.base},header:{flexDirection:'row',alignItems:'center'},info:{flex:1,marginLeft:SPACING.sm},topic:{...FONTS.regular,fontWeight:'600',color:COLORS.text},date:{...FONTS.small,color:COLORS.textSecondary},meta:{...FONTS.small,color:COLORS.textSecondary,marginTop:SPACING.sm}});
export default HistoryScreen;
