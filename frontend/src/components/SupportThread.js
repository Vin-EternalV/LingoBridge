import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const Bubble = ({ mine, author, date, text }) => (
  <View style={[styles.row, mine && styles.rowMine]}>
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
      <Text style={[styles.author, mine && styles.authorMine]}>
        {author} · {date}
      </Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  </View>
);

// The whole conversation of one support request: the learner's first message, then every reply in order.
// viewer: 'learner' (their own messages are on the right) or 'admin' (support messages are on the right).
const SupportThread = ({ ticket, viewer, learnerName = 'Learner' }) => {
  const learnerView = viewer === 'learner';
  const replies = ticket.replies || [];

  return (
    <View>
      <Bubble
        mine={learnerView}
        author={learnerView ? 'You' : learnerName}
        date={formatDateTime(ticket.createdAt)}
        text={ticket.message}
      />
      {replies.map((reply) => {
        const fromLearner = reply.from === 'learner';
        const mine = learnerView ? fromLearner : !fromLearner;
        let author;
        if (fromLearner) author = learnerView ? 'You' : learnerName;
        else author = learnerView ? 'Support team' : reply.authorName || 'Support team';
        return (
          <Bubble key={reply._id} mine={mine} author={author} date={formatDateTime(reply.createdAt)} text={reply.message} />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: SPACING.sm, paddingRight: SPACING.xl },
  rowMine: { justifyContent: 'flex-end', paddingRight: 0, paddingLeft: SPACING.xl },
  bubble: { borderRadius: RADIUS.md, padding: SPACING.md, flexShrink: 1 },
  bubbleMine: { backgroundColor: COLORS.primaryLight },
  bubbleOther: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  author: { ...FONTS.tiny, fontWeight: '600', marginBottom: SPACING.xs },
  authorMine: { color: COLORS.primaryDark },
  text: { ...FONTS.small, color: COLORS.text, lineHeight: 21 },
});

export default SupportThread;
