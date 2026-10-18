import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { TOPICS_BY_SKILL } from '../../constants/learningOptions';
import * as practiceApi from '../../api/practice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';


const TopicSelectionScreen = ({ route, navigation }) => {
  const { skill, difficulty: initialDifficulty } = route.params;
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState(initialDifficulty || 'medium');
  const [topics, setTopics] = useState(TOPICS_BY_SKILL[skill] || []);
  const [adminTopics, setAdminTopics] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState('');

  useEffect(() => {
    let mounted = true;
    practiceApi.getLearningContent(skill)
      .then((items) => {
        if (!mounted) return;
        setAdminTopics(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (mounted) setTopicsError('Could not load admin topics. Showing the default topics instead.');
      })
      .finally(() => { if (mounted) setLoadingTopics(false); });
    return () => { mounted = false; };
  }, [skill]);

  useEffect(() => {
    if (adminTopics === null) return;
    const matching = adminTopics
      .filter((item) => !item.difficulty || item.difficulty === difficulty)
      .map((item) => item.topic);
    setTopics(matching);
    if (selectedTopic && !matching.includes(selectedTopic)) setSelectedTopic('');
  }, [adminTopics, difficulty]);
  const skillTitle = skill.charAt(0).toUpperCase() + skill.slice(1);

  const handleStart = () => {
    const finalTopic = customTopic.trim() ? customTopic : selectedTopic;
    if (!finalTopic) return;
    
    navigation.navigate('Exercise', {
      skill,
      topic: finalTopic,
      difficulty
    });
  };

  const handleTopicSelect = (t) => {
    setSelectedTopic(t);
    setCustomTopic('');
  };

  const handleCustomTopicChange = (text) => {
    setCustomTopic(text);
    setSelectedTopic('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={`${skillTitle} Practice`} showBack />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          <View style={styles.difficultyContainer}>
            {['easy', 'medium', 'hard'].map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.difficultyBtn,
                  difficulty === diff && styles.difficultyBtnActive
                ]}
                onPress={() => setDifficulty(diff)}
              >
                <Text style={[
                  styles.difficultyText,
                  difficulty === diff && styles.difficultyTextActive
                ]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a Topic</Text>
          <ErrorMessage message={topicsError} />
          {loadingTopics ? <LoadingSpinner message="Loading topics..." /> : null}
          <View style={styles.topicsGrid}>
            {topics.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.topicPill,
                  selectedTopic === t && styles.topicPillSelected
                ]}
                onPress={() => handleTopicSelect(t)}
              >
                <Text style={[
                  styles.topicText,
                  selectedTopic === t && styles.topicTextSelected
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Or Enter Custom Topic</Text>
          <TextInput
            style={styles.customInput}
            placeholder="e.g. Discussing favorite movies..."
            value={customTopic}
            onChangeText={handleCustomTopicChange}
            placeholderTextColor={COLORS.textLight}
          />
        </View>

      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Start Practice Session" 
          onPress={handleStart} 
          disabled={!selectedTopic && !customTopic.trim()}
          fullWidth 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  difficultyContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  difficultyBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  difficultyText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  difficultyTextActive: {
    color: COLORS.primaryDark,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  topicPill: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  topicText: {
    ...FONTS.small,
    color: COLORS.text,
  },
  topicTextSelected: {
    color: COLORS.onPrimary,
    fontWeight: '500',
  },
  customInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...FONTS.regular,
    color: COLORS.text,
  },
  footer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default TopicSelectionScreen;
