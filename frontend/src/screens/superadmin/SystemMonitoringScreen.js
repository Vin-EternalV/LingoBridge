import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import Header from "../../components/Header";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import * as superAdminApi from "../../api/superadmin";
import { COLORS, FONTS, SPACING } from "../../constants/theme";

const DB_STATES = {
  0: "Disconnected",
  1: "Connected",
  2: "Connecting",
  3: "Disconnecting",
};
const mb = (bytes) => (bytes ? `${Math.round(bytes / 1024 / 1024)} MB` : "—");

const SystemMonitoringScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [system, setSystem] = useState(null);

  const fetchSystemStatus = async () => {
    try {
      const data = await superAdminApi.getSystemMonitoring();
      setSystem(data);
    } catch (err) {
      console.log("System status error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSystemStatus();
  };

  if (loading)
    return (
      <LoadingSpinner fullScreen message="Loading System Health Metrics..." />
    );

  const memoryUsage = mb(system?.memory?.rss);
  const heapUsed = mb(system?.memory?.heapUsed);
  const heapTotal = mb(system?.memory?.heapTotal);
  const external = mb(system?.memory?.external);
  const uptime = system?.uptime
    ? system.uptime >= 3600
      ? `${(system.uptime / 3600).toFixed(1)} hours`
      : `${Math.floor(system.uptime / 60)} minutes`
    : "—";
  const dbStatus = DB_STATES[system?.dbState] ?? "—";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="System Monitoring" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <Text style={styles.pageTitle}>Runtime Infrastructure Health</Text>

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard
              icon="server"
              label="API Server"
              value="Online"
              color={COLORS.success}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="file-tray-full"
              label="Memory Usage"
              value={memoryUsage}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="time"
              label="System Uptime"
              value={uptime}
              color="#8B5CF6"
            />
          </View>
          <View style={styles.col}>
            <StatCard
              icon="cube"
              label="MongoDB"
              value={dbStatus}
              color={system?.dbState === 1 ? COLORS.success : COLORS.error}
            />
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Process Metrics</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Heap used</Text>
            <Text style={styles.val}>{heapUsed}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Heap total</Text>
            <Text style={styles.val}>{heapTotal}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>External memory</Text>
            <Text style={styles.val}>{external}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Database state</Text>
            <Text style={styles.val}>{dbStatus}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: SPACING.base },
  pageTitle: { ...FONTS.h2, marginBottom: SPACING.base },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.base,
  },
  col: { width: "48%", marginBottom: SPACING.base },
  card: { padding: SPACING.base },
  cardTitle: { ...FONTS.h3, marginBottom: SPACING.base },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: { ...FONTS.regular },
  val: { ...FONTS.regular, fontWeight: "bold", color: COLORS.primary },
});

export default SystemMonitoringScreen;
