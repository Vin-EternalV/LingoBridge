import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../../components/Header";
import DataTable from "../../components/DataTable";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import * as adminApi from "../../api/admin";
import { getErrorMessage } from "../../utils/errors";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const SKILLS = ["grammar", "vocabulary", "reading", "writing", "speaking"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const EMPTY = {
  skill: "grammar",
  topic: "",
  description: "",
  difficulty: "medium",
};

const LearningContentScreen = () => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [editing, setEditing] = useState(null); // null | { mode: 'create' | 'edit' | 'delete', data }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getContent();
      setContent(data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load content."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setEditing({ mode: "create" });
  };

  const openEdit = (item) => {
    setForm({
      skill: item.skill,
      topic: item.topic,
      description: item.description || "",
      difficulty: item.difficulty || "medium",
    });
    setEditing({ mode: "edit", data: item });
  };

  const openDelete = (item) => setEditing({ mode: "delete", data: item });

  const handleSave = async () => {
    if (!form.topic.trim()) {
      setError("Topic is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing.mode === "create") await adminApi.createContent(form);
      else await adminApi.updateContent(editing.data._id, form);
      setEditing(null);
      fetchContent();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    try {
      await adminApi.deleteContent(editing.data._id);
      setEditing(null);
      fetchContent();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: "Skill", key: "skill", width: 110 },
    { title: "Topic", key: "topic", width: 200 },
    { title: "Difficulty", key: "difficulty", width: 110 },
    { title: "Description", key: "description", width: 260 },
    { title: "Status", key: "isActive", width: 100 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Learning Content" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Learning Topics</Text>
          <Button title="+ Add Topic" onPress={openCreate} />
        </View>

        <ErrorMessage message={error} />

        {loading ? (
          <LoadingSpinner message="Loading learning content..." />
        ) : (
          <DataTable
            columns={columns}
            data={content}
            onRowAction={openEdit}
            actionLabel="Manage"
          />
        )}
      </ScrollView>

      <Modal
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing?.mode === "create"
            ? "Add topic"
            : editing?.mode === "edit"
              ? "Edit topic"
              : "Delete topic"
        }
        footer={
          editing?.mode === "delete" ? (
            <View style={styles.row}>
              <View style={styles.half}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setEditing(null)}
                  fullWidth
                />
              </View>
              <View style={styles.half}>
                <Button
                  title="Delete"
                  variant="danger"
                  onPress={handleDelete}
                  loading={saving}
                  fullWidth
                />
              </View>
            </View>
          ) : (
            <Button
              title={editing?.mode === "edit" ? "Save changes" : "Create topic"}
              onPress={handleSave}
              loading={saving}
              fullWidth
            />
          )
        }
      >
        {editing?.mode === "delete" ? (
          <Text style={styles.deleteText}>
            Delete "{editing.data.topic}"? This cannot be undone.
          </Text>
        ) : (
          <View>
            <Text style={styles.fieldLabel}>Skill</Text>
            <View style={styles.chipWrap}>
              {SKILLS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={form.skill === s}
                  onPress={() => setForm({ ...form, skill: s })}
                />
              ))}
            </View>
            <Text style={styles.fieldLabel}>Difficulty</Text>
            <View style={styles.chipWrap}>
              {DIFFICULTIES.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={form.difficulty === d}
                  onPress={() => setForm({ ...form, difficulty: d })}
                />
              ))}
            </View>
            <Input
              label="Topic"
              value={form.topic}
              onChangeText={(v) => setForm({ ...form, topic: v })}
              placeholder="e.g. Present Tenses"
            />
            <Input
              label="Description"
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Short description"
              multiline
            />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
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
  deleteText: { ...FONTS.regular, lineHeight: 22 },
  row: { flexDirection: "row", gap: SPACING.sm, width: "100%" },
  half: { flex: 1 },
});

export default LearningContentScreen;
