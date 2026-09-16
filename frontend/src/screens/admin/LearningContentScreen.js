import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Header from '../../components/Header';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as adminApi from '../../api/admin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const LearningContentScreen = () => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getContent();
      setContent(data || []);
    } catch (err) {
      console.log('Content fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDelete = (item) => {
    Alert.alert('Delete Content Topic', `Are you sure you want to delete ${item.topic}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteContent(item._id);
            fetchContent();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete content');
          }
        }
      }
    ]);
  };

  const columns = [
    { title: 'Skill', key: 'skill', width: 110 },
    { title: 'Topic', key: 'topic', width: 200 },
    { title: 'Difficulty', key: 'difficulty', width: 110 },
    { title: 'Description', key: 'description', width: 260 },
    { title: 'Status', key: 'isActive', width: 100 }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Learning Content" />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Learning Topics</Text>
          <Button
            title="+ Add Topic"
          onPress={() => Alert.alert('Add Content', 'Use the API endpoint to add content. A content editor form has not been designed yet.')}
          />
        </View>

        {loading ? (
          <LoadingSpinner message="Loading learning content..." />
        ) : (
          <DataTable
            columns={columns}
            data={content}
            onRowAction={handleDelete}
            actionLabel="Delete"
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
});

export default LearningContentScreen;
