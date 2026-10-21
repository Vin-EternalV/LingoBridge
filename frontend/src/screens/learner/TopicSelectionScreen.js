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
import { useAuth } from '../../contexts/AuthContext';

const TOPIC_SUGGESTIONS = {
  grammar: [
    { topic: 'Everyday Tenses', description: 'Talk about routines, current activities, and past experiences.' },
    { topic: 'Making Plans', description: 'Practice conditionals and useful phrases for future plans.' },
    { topic: 'Describing People', description: 'Use adjectives and sentence structures to describe someone.' },
  ],
  vocabulary: [
    { topic: 'At the Restaurant', description: 'Learn words for ordering food and talking about meals.' },
    { topic: 'Travel and Directions', description: 'Build useful vocabulary for getting around while traveling.' },
    { topic: 'Workplace Conversations', description: 'Practice common words and phrases used at work.' },
  ],
  reading: [
    { topic: 'A Day in the City', description: 'Read a short story about places, people, and daily routines.' },
    { topic: 'Healthy Habits', description: 'Explore an informative passage about everyday well-being.' },
    { topic: 'A Travel Journal', description: 'Follow a personal account of a trip and its memorable moments.' },
  ],
  writing: [
    { topic: 'A Memorable Weekend', description: 'Write a clear paragraph about an experience you enjoyed.' },
    { topic: 'Your Ideal Workplace', description: 'Describe the environment where you do your best work.' },
    { topic: 'A Friendly Invitation', description: 'Practice writing a warm message with useful details.' },
  ],
  speaking: [
    { topic: 'Introducing Yourself', description: 'Share your background, interests, and what you are learning.' },
    { topic: 'A Favorite Place', description: 'Describe a place you enjoy and explain what makes it special.' },
    { topic: 'Sharing an Opinion', description: 'Give your view on a familiar topic and support it with reasons.' },
  ],
};

const SEXUAL_TOPIC_PATTERN = /\b(sex|sexual|porn|pornography|erotic|erotica|nude|nudity|genital|intercourse|orgasm|masturbat\w*|fetish|brothel|prostitut\w*|rape|incest)\b/i;
const ENGLISH_TRAINING_PATTERN = /\b(english|grammar|vocabulary|vocab|word\w*|sentence\w*|tense\w*|verb\w*|adjective\w*|adverb\w*|preposition\w*|article\w*|punctuation|spelling|pronunciation|phonics|idiom\w*|phrase\w*|conversation\w*|speak\w*|writ\w*|read\w*|comprehension|essay\w*|paragraph\w*|email\w*|communication|question\w*|introduc\w*|describ\w*|opinion\w*|interview\w*|presentation\w*|story\w*|summar\w*|conditionals?|passive voice|past tense|present tense|future tense)\b/i;


const TopicSelectionScreen = ({ route, navigation }) => {
  const { skill, difficulty: initialDifficulty } = route.params;
  const { user } = useAuth();
  const level = user?.profile?.currentEnglishLevel || user?.profile?.englishLevel || 'beginner';
  const unlocked = level === 'advanced' ? ['easy', 'medium', 'hard'] : level === 'intermediate' || level === 'upper_intermediate' ? ['easy', 'medium'] : ['easy'];
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customTopicError, setCustomTopicError] = useState('');
  const [difficulty, setDifficulty] = useState(unlocked.includes(initialDifficulty) ? initialDifficulty : unlocked[unlocked.length - 1]);
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
  const topicSuggestions = TOPIC_SUGGESTIONS[skill] || TOPIC_SUGGESTIONS.speaking;
  const selectedSuggestion = topicSuggestions.find(({ topic }) => topic === selectedTopic);
  const adminTopicDetails = adminTopics?.filter((item) => !item.difficulty || item.difficulty === difficulty) || [];
  const selectedAdminTopic = adminTopicDetails.find((item) => item.topic === selectedTopic);

  const handleStart = () => {
    const isCustomTopic = !!customTopic.trim();
    const finalTopic = isCustomTopic ? customTopic.trim() : selectedTopic;
    if (!finalTopic) return;

    if (isCustomTopic && SEXUAL_TOPIC_PATTERN.test(finalTopic)) {
      setCustomTopicError('Sexual content is not allowed. Enter a safe English-learning topic.');
      return;
    }
    if (isCustomTopic && !ENGLISH_TRAINING_PATTERN.test(finalTopic)) {
      setCustomTopicError('Custom topics must focus on English learning, such as grammar, vocabulary, reading, writing, or conversation.');
      return;
    }
    setCustomTopicError('');
    
    navigation.navigate('Exercise', {
      skill,
      topic: finalTopic,
      difficulty,
      isCustomTopic,
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
              (() => { const isUnlocked = unlocked.includes(diff); return (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.difficultyBtn,
                  difficulty === diff && styles.difficultyBtnActive
                ]}
                onPress={() => isUnlocked && setDifficulty(diff)}
                disabled={!isUnlocked}
              >
                {!isUnlocked && <Ionicons name="lock-closed" size={13} color={COLORS.textLight} />}
                <Text style={[
                  styles.difficultyText,
                  difficulty === diff && styles.difficultyTextActive,
                  !isUnlocked && styles.lockedDifficulty
                ]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </TouchableOpacity>
              ); })()
            ))}
          </View>
        </View>
        <Text style={styles.lockHint}>Complete all required sessions across the five skills to unlock the next difficulty.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a Topic</Text>
          <Text style={styles.suggestionsLabel}>Need an idea? Try one of these:</Text>
          <View style={styles.topicsGrid}>
            {topicSuggestions.map(({ topic }) => {
              const isSelected = selectedTopic === topic;
              return (
                <TouchableOpacity
                  key={topic}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.topicPill, isSelected && styles.topicPillSelected]}
                  onPress={() => handleTopicSelect(topic)}
                >
                  <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>{topic}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <ErrorMessage message={topicsError} />
          {loadingTopics ? <LoadingSpinner message="Loading topics..." /> : null}
          <View style={styles.topicsGrid}>
            {topics.map((t) => (
              <TouchableOpacity
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTopic === t }}
                style={[styles.topicPill, selectedTopic === t && styles.topicPillSelected]}
                onPress={() => handleTopicSelect(t)}
              >
                <Text style={[styles.topicText, selectedTopic === t && styles.topicTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedSuggestion?.description || selectedAdminTopic?.description?.trim() ? (
            <Text style={styles.selectedSuggestionDescription}>
              {selectedSuggestion?.description || selectedAdminTopic.description.trim()}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Or Enter Custom Topic</Text>
          <Text style={styles.customTopicHint}>
            Enter an English-learning topic, such as grammar, vocabulary, reading, writing, or conversation.
          </Text>
          <TextInput
            style={styles.customInput}
            placeholder="e.g. Practicing past-tense verbs..."
            value={customTopic}
            maxLength={100}
            onChangeText={(text) => { handleCustomTopicChange(text); setCustomTopicError(''); }}
            placeholderTextColor={COLORS.textLight}
          />
          <ErrorMessage message={customTopicError} />
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
    backgroundColor: "transparent",
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
  lockedDifficulty: { color: COLORS.textLight },
  lockHint: { ...FONTS.tiny, marginTop: -SPACING.md, marginBottom: SPACING.xl },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestionsLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  selectedSuggestionDescription: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.base,
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
  customTopicHint: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  footer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default TopicSelectionScreen;
