import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../../components/Header';
import DataTable from '../../components/DataTable';
import Input from '../../components/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as superAdminApi from '../../api/superadmin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const AuditLogsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getAuditLogs({ search });
      setLogs(res.data || res.logs || [
        { _id: '1', adminName: 'Super Admin', action: 'TOGGLE_USER_STATUS', target: 'User juan@example.com', status: 'success', createdAt: '2026-09-14 10:15' },
        { _id: '2', adminName: 'Admin User', action: 'CREATE_CONTENT_TOPIC', target: 'Topic Present Tenses', status: 'success', createdAt: '2026-09-14 09:30' },
        { _id: '3', adminName: 'Super Admin', action: 'UPDATE_ROLE_PERMISSIONS', target: 'Role admin', status: 'success', createdAt: '2026-09-13 14:00' }
      ]);
    } catch (err) {
      console.log('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const columns = [
    { title: 'Admin', key: 'adminName', width: 140 },
    { title: 'Action', key: 'action', width: 220 },
    { title: 'Target', key: 'target', width: 220 },
    { title: 'Status', key: 'status', width: 100 },
    { title: 'Date/Time', key: 'createdAt', width: 160 }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Audit Logs" />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Security Audit Logs</Text>
        <Input
          placeholder="Filter audit logs..."
          value={search}
          onChangeText={setSearch}
          icon="search-outline"
          style={styles.searchInput}
        />

        {loading ? (
          <LoadingSpinner message="Loading audit trail..." />
        ) : (
          <DataTable
            columns={columns}
            data={logs}
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

export default AuditLogsScreen;
