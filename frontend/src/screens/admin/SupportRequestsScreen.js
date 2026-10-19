import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import SupportThread from '../../components/SupportThread';
import StatusMessage from '../../components/StatusMessage';
import * as adminApi from '../../api/admin';
import { getErrorMessage } from '../../utils/errors';
import { confirmAction } from '../../utils/dialog';
import { emitNotificationsChanged } from '../../utils/notifications';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const CATEGORY_LABELS = {
  bug: 'Something is broken',
  account: 'Account',
  feedback: 'Feedback',
  other: 'Other',
};

const STATUS_BADGES = {
  open: { text: 'Open', variant: 'warning' },
  in_progress: { text: 'In progress', variant: 'info' },
  resolved: { text: 'Resolved', variant: 'success' },
  closed: { text: 'Closed', variant: 'neutral' },
};

// Statuses an admin can pick directly. "Closed" is a separate, deliberate step after Resolved.
const STATUS_ORDER = ['open', 'in_progress', 'resolved'];
const FILTER_ORDER = [...STATUS_ORDER, 'closed'];
const EMPTY_SUMMARY = { open: 0, in_progress: 0, resolved: 0, closed: 0 };

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Admin and superadmin: read the requests learners send from Help & Support, reply, and set their status.
const SupportRequestsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getSupportTickets(filter === 'all' ? undefined : { status: filter });
      setTickets(data.tickets || []);
      setSummary(data.summary || EMPTY_SUMMARY);
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err, 'Could not load support requests.') });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleTicket = (id) => {
    setOpenId((current) => (current === id ? null : id));
    setReply('');
    setStatus(null);
  };

  const update = async (ticket, changes, successMessage) => {
    setBusyId(ticket._id);
    setStatus(null);
    try {
      await adminApi.updateSupportTicket(ticket._id, changes);
      if (changes.reply !== undefined) setReply('');
      setStatus({ type: 'success', message: successMessage });
      await load();
      emitNotificationsChanged();
    } catch (err) {
      setStatus({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  // Formally close a resolved request. Anything typed in the reply box is sent as a closing message.
  const closeTicket = async (ticket) => {
    const ok = await confirmAction(
      'Close this request?',
      'The learner will no longer be able to reply. They can send a new request if they need more help. You can reopen it later if needed.',
      { confirmText: 'Close request' }
    );
    if (!ok) return;
    const note = reply.trim();
    update(ticket, note ? { status: 'closed', reply: note } : { status: 'closed' }, 'Request closed.');
  };

  const reopenTicket = async (ticket) => {
    const ok = await confirmAction('Reopen this request?', 'The learner will be able to reply again.', { confirmText: 'Reopen' });
    if (ok) update(ticket, { status: 'open' }, 'Request reopened.');
  };

  const sendReply = (ticket) => {
    if (!reply.trim()) {
      setStatus({ type: 'error', message: 'Write a reply first.' });
      return;
    }
    update(ticket, { reply: reply.trim() }, 'Reply sent. The learner can see it under Your requests.');
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading support requests..." />;

  const total = summary.open + summary.in_progress + summary.resolved + summary.closed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Support Requests" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Requests from learners</Text>

        <View style={styles.chipRow}>
          <Chip label={`All (${total})`} selected={filter === 'all'} onPress={() => setFilter('all')} style={styles.chip} />
          {FILTER_ORDER.map((key) => (
            <Chip
              key={key}
              label={`${STATUS_BADGES[key].text} (${summary[key]})`}
              selected={filter === key}
              onPress={() => setFilter(key)}
              style={styles.chip}
            />
          ))}
        </View>

        <StatusMessage type={status?.type} message={status?.message} />

        {tickets.length === 0 ? (
          <Text style={styles.empty}>No support requests here yet.</Text>
        ) : (
          tickets.map((ticket) => {
            const badge = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
            const expanded = openId === ticket._id;
            const replies = ticket.replies || [];
            const person = ticket.userId;
            const lastReply = replies[replies.length - 1];
            const waiting = !!lastReply && lastReply.from === 'learner' && ticket.status !== 'resolved' && ticket.status !== 'closed';
            const name = person ? `${person.firstName} ${person.lastName}`.trim() : 'Deleted account';
            return (
              <Card key={ticket._id} style={styles.card}>
                <TouchableOpacity
                  onPress={() => toggleTicket(ticket._id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                >
                  <View style={styles.row}>
                    <Text style={styles.subject} numberOfLines={expanded ? undefined : 1}>
                      {ticket.subject}
                    </Text>
                    <View style={styles.badges}>
                      {waiting && <Badge text="Learner replied" variant="error" />}
                      <Badge text={badge.text} variant={badge.variant} />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.meta} numberOfLines={1}>
                      {name}
                      {person?.email ? ` · ${person.email}` : ''}
                    </Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
                  </View>
                  <Text style={styles.meta}>
                    {CATEGORY_LABELS[ticket.category] || 'Other'} · {formatDateTime(ticket.createdAt)}
                    {replies.length > 0 ? ` · ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : ''}
                  </Text>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.body}>
                    <Text style={styles.label}>Conversation</Text>
                    <SupportThread ticket={ticket} viewer="admin" learnerName={name} />

                    {ticket.status === 'closed' ? (
                      <View style={styles.closedBox}>
                        <View style={styles.closedHeader}>
                          <Ionicons name="lock-closed" size={18} color={COLORS.textSecondary} />
                          <Text style={styles.closedTitle}>This request is closed</Text>
                        </View>
                        <Text style={styles.closedText}>
                          {ticket.closedAt ? `Closed on ${formatDateTime(ticket.closedAt)}. ` : ''}
                          The learner can't reply any more. Reopen it if the conversation needs to continue.
                        </Text>
                        <Button
                          title="Reopen request"
                          variant="outline"
                          onPress={() => reopenTicket(ticket)}
                          loading={busyId === ticket._id}
                          fullWidth
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.chipRow}>
                          {STATUS_ORDER.map((key) => (
                            <Chip
                              key={key}
                              label={STATUS_BADGES[key].text}
                              selected={ticket.status === key}
                              onPress={() => ticket.status !== key && update(ticket, { status: key }, 'Status updated.')}
                              style={styles.chip}
                            />
                          ))}
                        </View>

                        {ticket.status === 'resolved' && (
                          <View style={styles.closeBox}>
                            <Text style={styles.closeTitle}>Resolved. Ready to close this request?</Text>
                            <Text style={styles.closeText}>
                              Closing it is final for the learner: they can't reply and would need to send a new request.
                              Optional: write a closing message below and it will be sent when you close.
                            </Text>
                            <Button
                              title="Close request"
                              variant="danger"
                              onPress={() => closeTicket(ticket)}
                              loading={busyId === ticket._id}
                              fullWidth
                            />
                          </View>
                        )}

                        <Input
                          label={ticket.status === 'resolved' ? 'Closing message (optional)' : 'Reply to learner'}
                          value={reply}
                          onChangeText={setReply}
                          placeholder={ticket.status === 'resolved' ? 'e.g. Glad we could help. Closing this now.' : 'Write your answer...'}
                          multiline
                          maxLength={2000}
                        />
                        <Button
                          title="Send reply"
                          onPress={() => sendReply(ticket)}
                          loading={busyId === ticket._id}
                          fullWidth
                        />
                      </>
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: SPACING.base },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.base },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.sm },
  chip: { marginBottom: SPACING.sm },
  empty: { ...FONTS.small, textAlign: 'center', marginTop: SPACING.xl },
  card: { padding: SPACING.base, marginBottom: SPACING.base },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  subject: { ...FONTS.regular, fontWeight: '600', flex: 1, paddingRight: SPACING.md },
  meta: { ...FONTS.tiny, flexShrink: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  body: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  label: { ...FONTS.small, fontWeight: '600', marginTop: SPACING.sm, marginBottom: SPACING.xs },
  closeBox: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: SPACING.md, marginVertical: SPACING.sm },
  closeTitle: { ...FONTS.small, fontWeight: '600', marginBottom: SPACING.xs },
  closeText: { ...FONTS.tiny, marginBottom: SPACING.sm, lineHeight: 18 },
  closedBox: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  closedHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  closedTitle: { ...FONTS.small, fontWeight: '600' },
  closedText: { ...FONTS.tiny, marginBottom: SPACING.sm, lineHeight: 18 },
  text: { ...FONTS.small, color: COLORS.text, lineHeight: 21 },
  reply: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  replyAuthor: { ...FONTS.tiny, color: COLORS.primaryDark, fontWeight: '600', marginBottom: SPACING.xs },
});

export default SupportRequestsScreen;
