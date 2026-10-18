import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import DataTable from "../../components/DataTable";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import * as superAdminApi from "../../api/superadmin";
import { getErrorMessage } from "../../utils/errors";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const AuditLogsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await superAdminApi.getAuditLogs({ search });
      setLogs(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load audit logs."));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchLogs, 250);
    return () => clearTimeout(t);
  }, [search]);

  const columns = [
    { title: "Admin", key: "adminName", width: 140 },
    { title: "Action", key: "action", width: 220 },
    { title: "Target", key: "target", width: 220 },
    { title: "Status", key: "status", width: 100 },
    {
      title: "Date/Time",
      key: "createdAt",
      width: 180,
      render: (v) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Audit Logs" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Security Audit Logs</Text>
        <Input
          placeholder="Filter audit logs..."
          value={search}
          onChangeText={setSearch}
          icon="search-outline"
          style={styles.searchInput}
        />

        <ErrorMessage message={error} />

        {loading ? (
          <LoadingSpinner message="Loading audit trail..." />
        ) : (
          <DataTable columns={columns} data={logs} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.base },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.sm },
  searchInput: { marginBottom: SPACING.base },
});

export default AuditLogsScreen;
