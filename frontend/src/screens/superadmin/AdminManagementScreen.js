import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Header from '../../components/Header';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as superAdminApi from '../../api/superadmin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const AdminManagementScreen = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await superAdminApi.getAdmins();
      setAdmins(data || []);
    } catch (err) {
      console.log('Fetch admins error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggle = async (admin) => {
    const newStatus = !admin.isActive;
    Alert.alert(
      'Administrator Account Status',
      `Are you sure you want to ${newStatus ? 'enable' : 'disable'} ${admin.firstName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await superAdminApi.toggleAdminStatus(admin._id, newStatus);
              fetchAdmins();
            } catch (err) {
              Alert.alert('Error', err.message || 'Action failed');
            }
          }
        }
      ]
    );
  };

  const columns = [
    { title: 'First Name', key: 'firstName', width: 120 },
    { title: 'Last Name', key: 'lastName', width: 120 },
    { title: 'Email', key: 'email', width: 240 },
    { title: 'Role', key: 'role', width: 120 },
    { title: 'Status', key: 'isActive', width: 100 }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Administrator Management" />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>System Administrators</Text>
          <Button
            title="+ Add Administrator"
            onPress={() => Alert.alert('Add Admin', 'Administrator registration tool ready.')}
          />
        </View>

        {loading ? (
          <LoadingSpinner message="Loading administrator roster..." />
        ) : (
          <DataTable
            columns={columns}
            data={admins}
            onRowAction={handleToggle}
            actionLabel="Toggle"
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
});

export default AdminManagementScreen;
