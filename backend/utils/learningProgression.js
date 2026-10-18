const LEVELS = ['beginner', 'intermediate', 'advanced'];
const SKILLS = ['grammar', 'vocabulary', 'reading', 'writing', 'speaking'];
const LEVEL_REQUIREMENTS = { beginner: 4, intermediate: 8 };
const LEVEL_TOTALS = { beginner: 20, intermediate: 40 };
const DIFFICULTY_BY_LEVEL = { beginner: ['easy'], intermediate: ['easy', 'medium'], advanced: ['easy', 'medium', 'hard'] };

const normalizeLevel = (level) => {
  if (level === 'elementary') return 'beginner';
  if (level === 'upper_intermediate') return 'intermediate';
  return LEVELS.includes(level) ? level : 'beginner';
};

const completedBySkill = (profile, level) => {
  const values = profile?.levelProgress?.[level] || {};
  return Object.fromEntries(SKILLS.map((skill) => [skill, Number(values[skill]) || 0]));
};

const progressionView = (profile) => {
  const currentLevel = normalizeLevel(profile?.currentEnglishLevel || profile?.englishLevel);
  const counts = completedBySkill(profile, currentLevel);
  const requiredPerSkill = LEVEL_REQUIREMENTS[currentLevel] || 0;
  return {
    startingLevel: normalizeLevel(profile?.startingEnglishLevel || profile?.englishLevel),
    currentLevel,
    unlockedDifficulties: DIFFICULTY_BY_LEVEL[currentLevel],
    levelProgress: profile?.levelProgress || {},
    skills: SKILLS.map((skill) => ({ id: skill, completed: counts[skill], required: requiredPerSkill })),
    completedSessions: Object.values(counts).reduce((sum, value) => sum + value, 0),
    requiredSessions: LEVEL_TOTALS[currentLevel] || 0,
    nextLevel: currentLevel === 'beginner' ? 'intermediate' : currentLevel === 'intermediate' ? 'advanced' : null,
    advancementDates: { beginnerCompletedAt: profile?.beginnerCompletedAt || null, intermediateCompletedAt: profile?.intermediateCompletedAt || null },
  };
};

const ageOnDate = (dateOfBirth, now = new Date()) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob > now) return null;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
};

module.exports = { LEVELS, SKILLS, LEVEL_REQUIREMENTS, LEVEL_TOTALS, DIFFICULTY_BY_LEVEL, normalizeLevel, completedBySkill, progressionView, ageOnDate };
