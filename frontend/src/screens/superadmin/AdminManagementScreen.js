import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import DataTable from "../../components/DataTable";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import * as superAdminApi from "../../api/superadmin";
import { getErrorMessage } from "../../utils/errors";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "admin",
};

const AdminManagementScreen = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await superAdminApi.getAdmins();
      setAdmins(data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load admins."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 8 || form.password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await superAdminApi.createAdmin(form);
      setCreating(false);
      setForm(EMPTY);
      fetchAdmins();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await superAdminApi.toggleAdminStatus(selected._id, !selected.isActive);
      setSelected(null);
      fetchAdmins();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: "First Name", key: "firstName", width: 120 },
    { title: "Last Name", key: "lastName", width: 120 },
    { title: "Email", key: "email", width: 240 },
    { title: "Role", key: "role", width: 120 },
    { title: "Status", key: "isActive", width: 100 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Administrator Management" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>System Administrators</Text>
          <Button
            title="+ Add Administrator"
            onPress={() => {
              setForm(EMPTY);
              setCreating(true);
            }}
          />
        </View>

        <ErrorMessage message={error} />

        {loading ? (
          <LoadingSpinner message="Loading administrator roster..." />
        ) : (
          <DataTable
            columns={columns}
            data={admins}
            onRowAction={setSelected}
            actionLabel="Manage"
          />
        )}
      </ScrollView>

      <Modal
        visible={creating}
        onClose={() => setCreating(false)}
        title="Add administrator"
        footer={
          <Button
            title="Create"
            onPress={handleCreate}
            loading={saving}
            fullWidth
          />
        }
      >
        <Input
          label="First name"
          value={form.firstName}
          onChangeText={(v) => setForm({ ...form, firstName: v })}
          maxLength={50}
        />
        <Input
          label="Last name"
          value={form.lastName}
          onChangeText={(v) => setForm({ ...form, lastName: v })}
          maxLength={50}
        />
        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={254}
        />
        <Input
          label="Temporary password"
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          secureTextEntry
          maxLength={72}
        />
        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.chipWrap}>
          {["admin", "superadmin"].map((r) => (
            <Chip
              key={r}
              label={r}
              selected={form.role === r}
              onPress={() => setForm({ ...form, role: r })}
            />
          ))}
        </View>
      </Modal>

      <Modal
        visible={!!selected}
        onClose={() => setSelected(null)}
        title="Manage administrator"
        footer={
          <Button
            title={selected?.isActive ? "Disable" : "Enable"}
            variant={selected?.isActive ? "danger" : "primary"}
            onPress={handleToggle}
            loading={saving}
            fullWidth
          />
        }
      >
        {selected && (
          <View>
            <Text style={styles.fieldName}>
              {selected.firstName} {selected.lastName}
            </Text>
            <Text style={styles.fieldMuted}>{selected.email}</Text>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Role</Text>
              <Badge text={selected.role} variant="info" />
            </View>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Badge
                text={selected.isActive ? "Active" : "Inactive"}
                variant={selected.isActive ? "success" : "error"}
              />
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SPACING.base },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  pageTitle: { ...FONTS.h2, flex: 1 },
  fieldLabel: {
    ...FONTS.small,
    fontWeight: "600",
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.sm,
  },
  fieldName: { ...FONTS.h4, marginBottom: 4 },
  fieldMuted: { ...FONTS.small, marginBottom: SPACING.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});

export default AdminManagementScreen;
