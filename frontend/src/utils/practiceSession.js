export const getResumeSessionParams = (session) => {
  const exercises = (session.exercises || []).map((entry) => entry.exerciseData).filter(Boolean);
  const currentIndex = Math.min(session.currentIndex || 0, Math.max(0, exercises.length - 1));
  const answers = (session.exercises || []).slice(0, currentIndex);

  return {
    skill: session.skill,
    topic: session.topic,
    difficulty: session.difficulty,
    exercises,
    currentIndex,
    scoreInfo: {
      correct: answers.filter((entry) => entry.isCorrect).length,
      total: answers.length,
    },
    sessionId: session._id,
    startedAt: Date.now(),
    elapsedBefore: session.duration || 0,
    answers,
  };
};
