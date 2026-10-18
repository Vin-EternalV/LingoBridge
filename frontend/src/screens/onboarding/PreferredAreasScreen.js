import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const areas = [
  { id: 'grammar', title: 'Grammar', icon: 'book', description: 'Rules and structure' },
  { id: 'vocabulary', title: 'Vocabulary', icon: 'text', description: 'Words and phrases' },
  { id: 'reading', title: 'Reading', icon: 'newspaper', description: 'Comprehension' },
  { id: 'writing', title: 'Writing', icon: 'pencil', description: 'Text generation' },
  { id: 'speaking', title: 'Speaking', icon: 'mic', description: 'Pronunciation and flow' },
];

const PreferredAreasScreen = ({ navigation, route }) => {
  const [selectedAreas, setSelectedAreas] = useState([]);
  const previousData = route.params || {};

  const toggleArea = (id) => {
    if (selectedAreas.includes(id)) {
      setSelectedAreas(selectedAreas.filter(area => area !== id));
    } else {
      setSelectedAreas([...selectedAreas, id]);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Difficulties', { 
      ...previousData,
      areas: selectedAreas 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressContainer}>
        <ProgressBar progress={0.75} showLabel={false} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Which areas do you want to focus on?</Text>
          <Text style={styles.description}>Select the skills you want to improve the most.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {areas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <TouchableOpacity
                key={area.id}
                style={[
                  styles.card,
                  isSelected && styles.selectedCard
                ]}
                onPress={() => toggleArea(area.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[
                    styles.iconContainer,
                    isSelected && styles.selectedIconContainer
                  ]}>
                    <Ionicons 
                      name={area.icon} 
                      size={24} 
                      color={isSelected ? COLORS.white : COLORS.primary} 
                    />
                  </View>
                  <View>
                    <Text style={[
                      styles.cardTitle,
                      isSelected && styles.selectedText
                    ]}>
                      {area.title}
                    </Text>
                    <Text style={[
                      styles.cardDescription,
                      isSelected && styles.selectedText
                    ]}>
                      {area.description}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={isSelected ? COLORS.primary : COLORS.border} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          disabled={selectedAreas.length === 0}
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
  progressContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
  optionsContainer: {
    gap: SPACING.base,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  selectedIconContainer: {
    backgroundColor: COLORS.primary,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  cardDescription: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  selectedText: {
    color: COLORS.primaryDark,
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default PreferredAreasScreen;
