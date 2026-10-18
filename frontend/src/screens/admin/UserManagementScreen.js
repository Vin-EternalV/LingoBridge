import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Header from '../../components/Header';
import DataTable from '../../components/DataTable';
import Input from '../../components/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as adminApi from '../../api/admin';
import { useAuth } from '../../contexts/AuthContext';
import { confirmAction, notify } from '../../utils/dialog';
import { getErrorMessage } from '../../utils/errors';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const UserManagementScreen = () => {
  const { user: me } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({ search, limit: 100 });
      setUsers(res.data || res.users || []);
    } catch (err) {
      notify('Could not load users', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Wait a moment after typing so we don't search on every key press.
  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  // Same rules the server enforces (the server is the real check):
  // nobody changes their own status, superadmins are never disabled,
  // and only a superadmin can change an admin.
  const isProtected = (row) =>
    String(row._id) === String(me?._id || me?.id) ||
    row.role === 'superadmin' ||
    (row.role === 'admin' && me?.role !== 'superadmin');

  const handleToggleStatus = async (row) => {
    if (busyId || isProtected(row)) return;
    const enable = !row.isActive;
    const name = `${row.firstName} ${row.lastName}`.trim();

    const ok = await confirmAction(
      enable ? 'Enable account?' : 'Disable account?',
      enable
        ? `${name} will be able to sign in again.`
        : `${name} will be signed out and won't be able to sign in until you enable the account again.`,
      { confirmText: enable ? 'Enable' : 'Disable', destructive: !enable }
    );
    if (!ok) return;

    try {
      setBusyId(row._id);
      await adminApi.toggleUserStatus(row._id, enable);
      // Update just this row so the table doesn't jump or reload.
      setUsers((prev) => prev.map((u) => (u._id === row._id ? { ...u, isActive: enable } : u)));
    } catch (err) {
      notify('Status update failed', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { title: 'First Name', key: 'firstName', width: 120 },
    { title: 'Last Name', key: 'lastName', width: 120 },
    { title: 'Email', key: 'email', width: 260 },
    { title: 'Role', key: 'role', width: 120 },
    { title: 'Status', key: 'isActive', width: 100 }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="User Management" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Platform Accounts</Text>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
          icon="search-outline"
          style={styles.searchInput}
        />

        {loading ? (
          <LoadingSpinner message="Loading user directory..." />
        ) : (
          <DataTable
            columns={columns}
            data={users}
            onRowAction={handleToggleStatus}
            actionHeader="Action"
            actionLabel={(row) => (row.isActive ? 'Disable' : 'Enable')}
            actionVariant={(row) => (row.isActive ? 'danger' : 'success')}
            isActionDisabled={(row) => isProtected(row) || busyId === row._id}
          />
        )}
      </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    marginBottom: SPACING.base,
  },
});

export default UserManagementScreen;
