import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Header from '../../components/Header';
import DataTable from '../../components/DataTable';
import Input from '../../components/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as adminApi from '../../api/admin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const UserManagementScreen = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({ search });
      setUsers(res.data || res.users || []);
    } catch (err) {
      console.log('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    Alert.alert(
      'Update Account Status',
      `Are you sure you want to ${newStatus ? 'enable' : 'disable'} account for ${user.firstName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await adminApi.toggleUserStatus(user._id, newStatus);
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.message || 'Status update failed');
            }
          }
        }
      ]
    );
  };

  const columns = [
    { title: 'First Name', key: 'firstName', width: 120 },
    { title: 'Last Name', key: 'lastName', width: 120 },
    { title: 'Email', key: 'email', width: 220 },
    { title: 'Role', key: 'role', width: 100 },
    { title: 'Status', key: 'isActive', width: 100 }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="User Management" />
      <View style={styles.container}>
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
            actionLabel="Status"
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
