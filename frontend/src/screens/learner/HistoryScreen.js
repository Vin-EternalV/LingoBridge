import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { getHistory } from "../../api/progress";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const icons = {
  grammar: "book",
  vocabulary: "text",
  reading: "newspaper",
  writing: "pencil",
  speaking: "mic",
};
const filters = [
  "All",
  "Grammar",
  "Vocabulary",
  "Reading",
  "Writing",
  "Speaking",
];
const title = (v) => v.charAt(0).toUpperCase() + v.slice(1);

const HistoryScreen = ({ navigation }) => {
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await getHistory(
        filter === "All" ? {} : { skill: filter.toLowerCase() },
      );
      setSessions(response.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load practice history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }) => {
    const isCompleted = item.status === "completed";
    const acc = item.accuracy || 0;
    const variant = acc >= 80 ? "success" : acc >= 60 ? "warning" : "error";
    return (
      <Card
        style={styles.card}
        onPress={() =>
          navigation.navigate("HistoryDetail", { sessionId: item._id })
        }
      >
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons
              name={icons[item.skill] || "book"}
              size={20}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.topic} numberOfLines={1}>
              {item.topic}
            </Text>
            <Text style={styles.date}>
              {new Date(item.completedAt || item.createdAt).toLocaleString()} ·{" "}
              {title(item.skill)}
            </Text>
          </View>
          {isCompleted ? (
            <Badge text={`${acc}%`} variant={variant} />
          ) : (
            <Badge text="In progress" variant="info" />
          )}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {item.correctAnswers || 0}/{item.totalQuestions || 0} correct
          </Text>
          <Text style={styles.meta}>{item.duration || 0} min</Text>
          <Text style={styles.meta}>{title(item.status)}</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Practice History" showBack />
      <View>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filter, filter === item && styles.active]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.activeText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.body}>
        {loading ? (
          <LoadingSpinner message="Loading practice history..." />
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            onRefresh={onRefresh}
            refreshing={refreshing}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                title="No practice sessions yet"
                description={
                  error || "Complete a practice session to see it here."
                }
                icon="time-outline"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  filters: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: "center",
  },
  filter: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 36,
    justifyContent: "center",
  },
  active: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterText: { ...FONTS.small, color: COLORS.textSecondary },
  activeText: { color: COLORS.primaryDark, fontWeight: "600" },
  body: { flex: 1 },
  list: { padding: SPACING.base, paddingBottom: SPACING.xxl, flexGrow: 1 },
  card: { padding: SPACING.base },
  row: { flexDirection: "row", alignItems: "center" },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLighter,
  },
  info: { flex: 1, marginLeft: SPACING.sm },
  topic: { ...FONTS.regular, fontWeight: "600" },
  date: { ...FONTS.small, marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  meta: { ...FONTS.small, color: COLORS.textSecondary },
});

export default HistoryScreen;
