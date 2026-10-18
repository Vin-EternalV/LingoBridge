import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as supportApi from '../../api/support';
import { getErrorMessage } from '../../utils/errors';
import { emitNotificationsChanged } from '../../utils/notifications';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import Badge from '../../components/Badge';
import SectionLabel from '../../components/SectionLabel';
import SupportThread from '../../components/SupportThread';
import StatusMessage from '../../components/StatusMessage';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const FAQS = [
  {
    q: 'How do I change my English level or learning goals?',
    a: 'Go to Profile > Learning Profile. You can update your level, goals, preferred areas and difficulties at any time.',
  },
  {
    q: 'How is my streak calculated?',
    a: 'Your streak grows by one for each day you complete at least one practice session. If you miss a day, it starts again from 1 the next time you practise. Your longest streak is always kept.',
  },
  {
    q: 'How do daily and weekly goals work?',
    a: 'Open Profile > Goals & Progress. The daily goal counts the minutes you practise today, and the weekly goal counts your completed sessions over the last 7 days. You can change both goals whenever you like.',
  },
  {
    q: 'How do I turn on practice reminders?',
    a: 'Go to Profile > Notifications, switch on the daily reminder and choose a time. Reminders are delivered by the mobile app, and you may need to allow notifications for LingoBridge in your device settings.',
  },
  {
    q: 'How does the AI Assistant work?',
    a: 'The AI Assistant is an AI tutor that can explain grammar, answer questions and help you practise. AI answers can occasionally be wrong, so double-check anything important.',
  },
  {
    q: 'I forgot my password.',
    a: 'On the login screen, choose Forgot password and follow the steps. If you are already signed in, you can change it under Profile > Account Settings.',
  },
  {
    q: 'How do I switch to dark mode or make the text bigger?',
    a: 'Go to Profile > Appearance. Choose a theme and text size, then tap Apply. The app restarts to apply your choice.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile > Account Settings and use the Delete my account option at the bottom. Deletion is permanent and removes your progress and practice history.',
  },
];

const CATEGORIES = [
  { id: 'bug', title: 'Something is broken' },
  { id: 'account', title: 'Account' },
  { id: 'feedback', title: 'Feedback' },
  { id: 'other', title: 'Other' },
];

const STATUS_BADGES = {
  open: { text: 'Open', variant: 'warning' },
  in_progress: { text: 'In progress', variant: 'info' },
  resolved: { text: 'Resolved', variant: 'success' },
  closed: { text: 'Closed', variant: 'neutral' },
};

const FaqItem = ({ item, open, onPress, last }) => (
  <View style={[styles.faqItem, !last && styles.faqDivider]}>
    <TouchableOpacity style={styles.faqHeader} onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      <Text style={styles.faqQuestion}>{item.q}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textLight} />
    </TouchableOpacity>
    {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
  </View>
);

const HelpSupportScreen = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [category, setCategory] = useState('other');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [openTicketId, setOpenTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyStatus, setReplyStatus] = useState(null);

  const loadTickets = useCallback(async () => {
    try {
      setTickets(await supportApi.getMyTickets());
    } catch (err) {
      // The list is a convenience; the FAQ and form still work without it.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const toggleTicket = (id) => {
    const opening = openTicketId !== id;
    if (opening) {
      // Opening a request marks its replies as read, which clears the bell.
      supportApi
        .markTicketSeen(id)
        .then(emitNotificationsChanged)
        .catch(() => {});
    }
    setOpenTicketId((current) => (current === id ? null : id));
    setReplyText('');
    setReplyStatus(null);
  };

  const handleReply = async (ticket) => {
    setReplyStatus(null);
    if (!replyText.trim()) {
      setReplyStatus({ type: 'error', message: 'Write a message first.' });
      return;
    }
    setReplyingId(ticket._id);
    try {
      await supportApi.replyToTicket(ticket._id, replyText.trim());
      setReplyText('');
      await loadTickets();
    } catch (err) {
      setReplyStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setReplyingId(null);
    }
  };

  const handleSend = async () => {
    setStatus(null);
    if (subject.trim().length < 3) {
      setStatus({ type: 'error', message: 'Please add a short subject (at least 3 characters).' });
      return;
    }
    if (message.trim().length < 10) {
      setStatus({ type: 'error', message: 'Please describe your question in at least 10 characters.' });
      return;
    }

    setSending(true);
    try {
      await supportApi.createTicket({ category, subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      setCategory('other');
      setStatus({ type: 'success', message: "Thanks! We've received your request." });
      loadTickets();
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen title="Help & Support">
      <SectionLabel>Frequently asked questions</SectionLabel>
      <View style={styles.faqList}>
        {FAQS.map((item, index) => (
          <FaqItem
            key={item.q}
            item={item}
            open={openIndex === index}
            last={index === FAQS.length - 1}
            onPress={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </View>

      <SectionLabel hint="Can't find your answer? Send us a message.">Contact support</SectionLabel>
      <StatusMessage type={status?.type} message={status?.message} />
      <Card>
        <Text style={styles.fieldLabel}>Topic</Text>
        <View style={styles.chipWrap}>
          {CATEGORIES.map((item) => (
            <Chip
              key={item.id}
              label={item.title}
              selected={category === item.id}
              onPress={() => setCategory(item.id)}
            />
          ))}
        </View>
        <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Short summary" maxLength={120} />
        <Input
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what happened or what you need help with"
          multiline
          maxLength={2000}
        />
        <Button title="Send message" onPress={handleSend} loading={sending} fullWidth />
      </Card>

      {tickets.length > 0 && (
        <>
          <SectionLabel>Your requests</SectionLabel>
          {tickets.map((ticket) => {
            const badge = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
            const expanded = openTicketId === ticket._id;
            const replies = ticket.replies || [];
            const category = CATEGORIES.find((c) => c.id === ticket.category);
            return (
              <Card key={ticket._id}>
                <TouchableOpacity
                  onPress={() => toggleTicket(ticket._id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject} numberOfLines={expanded ? undefined : 1}>
                      {ticket.subject}
                    </Text>
                    <Badge text={badge.text} variant={badge.variant} />
                  </View>
                  <View style={styles.ticketMeta}>
                    <Text style={styles.ticketDate}>
                      {category ? `${category.title} · ` : ''}
                      {new Date(ticket.createdAt).toLocaleDateString()}
                      {replies.length > 0 ? ` · ${replies.length} ${replies.length === 1 ? 'message' : 'messages'} after yours` : ''}
                    </Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.ticketBody}>
                    <SupportThread ticket={ticket} viewer="learner" />
                    {replies.length === 0 && (
                      <Text style={styles.ticketDate}>No reply yet. We'll get back to you as soon as we can.</Text>
                    )}

                    <StatusMessage type={replyStatus?.type} message={replyStatus?.message} />
                    {ticket.status === 'closed' ? (
                      <Text style={styles.reopenHint}>
                        This request was closed{ticket.closedAt ? ` on ${new Date(ticket.closedAt).toLocaleDateString()}` : ''}.
                        If you still need help, send us a new request above.
                      </Text>
                    ) : (
                      <>
                        <Input
                          label="Your reply"
                          value={replyText}
                          onChangeText={setReplyText}
                          placeholder="Write a message..."
                          multiline
                          maxLength={2000}
                        />
                        {ticket.status === 'resolved' && (
                          <Text style={styles.reopenHint}>This request is resolved. Sending a message will reopen it.</Text>
                        )}
                        <Button
                          title="Send reply"
                          onPress={() => handleReply(ticket)}
                          loading={replyingId === ticket._id}
                          fullWidth
                        />
                      </>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  faqList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  faqItem: { paddingHorizontal: SPACING.base },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.base },
  faqQuestion: { ...FONTS.regular, fontWeight: '600', flex: 1, paddingRight: SPACING.md },
  faqAnswer: { ...FONTS.small, paddingBottom: SPACING.base, lineHeight: 21 },
  fieldLabel: { ...FONTS.small, fontWeight: '600', marginBottom: SPACING.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.sm },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketSubject: { ...FONTS.regular, fontWeight: '600', flex: 1, paddingRight: SPACING.md },
  ticketDate: { ...FONTS.tiny, marginTop: SPACING.xs },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketBody: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  ticketLabel: { ...FONTS.small, fontWeight: '600', marginTop: SPACING.sm, marginBottom: SPACING.xs },
  reopenHint: { ...FONTS.tiny, marginBottom: SPACING.sm },
  ticketMessage: { ...FONTS.small, color: COLORS.text, lineHeight: 21 },
  reply: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  replyAuthor: { ...FONTS.tiny, color: COLORS.primaryDark, fontWeight: '600', marginBottom: SPACING.xs },
});

export default HelpSupportScreen;
