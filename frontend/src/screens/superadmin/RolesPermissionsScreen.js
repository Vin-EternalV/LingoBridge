import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as superAdminApi from '../../api/superadmin';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const RolesPermissionsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await superAdminApi.getRoles();
        setRoles(data);
      } catch (err) {
        console.log('Roles fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading Role Matrix..." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Roles & Permissions" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Access Control Matrix</Text>

        <Card style={styles.card}>
          <View style={styles.roleHeader}>
            <Text style={styles.roleName}>Learner Role</Text>
            <Badge text="Standard User" variant="info" />
          </View>
          <Text style={styles.permText}>• Register and update learning profile</Text>
          <Text style={styles.permText}>• Receive AI-generated exercises</Text>
          <Text style={styles.permText}>• Submit answers and receive AI feedback</Text>
          <Text style={styles.permText}>• Use AI English Tutor Assistant</Text>
          <Text style={styles.permText}>• Track progress and view practice history</Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.roleHeader}>
            <Text style={styles.roleName}>Admin Role</Text>
            <Badge text="Staff" variant="warning" />
          </View>
          <Text style={styles.permText}>• All Learner features</Text>
          <Text style={styles.permText}>• Manage learner accounts (enable/disable)</Text>
          <Text style={styles.permText}>• Manage learning categories and topics</Text>
          <Text style={styles.permText}>• View AI activity and usage stats</Text>
          <Text style={styles.permText}>• View platform learning reports</Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.roleHeader}>
            <Text style={styles.roleName}>Super Admin Role</Text>
            <Badge text="Full Access" variant="success" />
          </View>
          <Text style={styles.permText}>• All Admin features</Text>
          <Text style={styles.permText}>• Create and manage administrator accounts</Text>
          <Text style={styles.permText}>• Configure role permissions</Text>
          <Text style={styles.permText}>• View deep platform analytics</Text>
          <Text style={styles.permText}>• Real-time system monitoring</Text>
          <Text style={styles.permText}>• View complete system audit logs</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
  },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  card: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roleName: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  permText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});

export default RolesPermissionsScreen;
