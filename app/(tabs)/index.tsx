import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  FileText,
  Briefcase,
  Mic,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { SUBSCRIPTION_FEATURES } from "@/types/subscription";

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { state } = useApp();

  const features = SUBSCRIPTION_FEATURES[state.user.subscription];

  const quickActions = [
    {
      icon: Sparkles,
      title: "Optimize Resume",
      subtitle: "AI-powered improvements",
      color: theme.primary,
      route: "/resume-optimizer",
    },
    {
      icon: FileText,
      title: "Cover Letter",
      subtitle: "Generate tailored letter",
      color: theme.accent,
      route: "/cover-letter",
    },
    {
      icon: Briefcase,
      title: "Analyze Job",
      subtitle: "Match score & keywords",
      color: "#F59E0B",
      route: "/job-analyzer",
    },
    {
      icon: Mic,
      title: "Interview Prep",
      subtitle: features.aiInterviewSimulator ? "AI mock interviews" : "PRO feature",
      color: "#EF4444",
      route: "/interview",
      locked: !features.aiInterviewSimulator,
    },
  ];

  const stats = [
    {
      label: "Resumes",
      value: state.resumes.length.toString(),
      icon: FileText,
      color: theme.primary,
    },
    {
      label: "Applications",
      value: state.applications.length.toString(),
      icon: CheckCircle2,
      color: theme.success,
    },
    {
      label: "Interviews",
      value: state.interviewSessions.length.toString(),
      icon: Clock,
      color: theme.warning,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Welcome back,
              </Text>
              <Text style={[styles.name, { color: theme.text }]}>
                {state.user.name}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.badge, { backgroundColor: theme.accent + "20" }]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: theme.accent, textTransform: "uppercase" },
                ]}
              >
                {state.user.subscription}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={[styles.statCard, { backgroundColor: theme.surface }]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: stat.color + "15" }]}
                >
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.actionCard, { backgroundColor: theme.surface }]}
                  onPress={() => {
                    if (action.locked) {
                      router.push("/(tabs)/profile");
                    } else {
                      router.push(action.route as any);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: action.color + "15" },
                    ]}
                  >
                    <action.icon size={24} color={action.color} />
                    {action.locked && (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockText}>🔒</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.actionTitle, { color: theme.text }]}>
                    {action.title}
                  </Text>
                  <Text
                    style={[styles.actionSubtitle, { color: theme.textSecondary }]}
                  >
                    {action.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {state.user.subscription === "free" && (
            <TouchableOpacity
              style={[styles.upgradeCard, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/profile")}
              activeOpacity={0.9}
            >
              <View style={styles.upgradeContent}>
                <TrendingUp size={32} color="white" />
                <View style={styles.upgradeText}>
                  <Text style={styles.upgradeTitle}>Upgrade to Plus</Text>
                  <Text style={styles.upgradeSubtitle}>
                    Unlimited resumes, cover letters & job analyses
                  </Text>
                </View>
              </View>
              <Text style={styles.upgradePrice}>$9.99/mo</Text>
            </TouchableOpacity>
          )}

          {state.applications.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Applications
              </Text>
              {state.applications.slice(0, 3).map((app) => {
                const job = state.jobs.find((j) => j.id === app.jobId);
                return (
                  <View
                    key={app.id}
                    style={[
                      styles.applicationCard,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <View style={styles.applicationHeader}>
                      <View style={styles.applicationInfo}>
                        <Text style={[styles.jobTitle, { color: theme.text }]}>
                          {job?.title || "Job Title"}
                        </Text>
                        <Text
                          style={[
                            styles.companyName,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {job?.company || "Company"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(app.status) + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(app.status) },
                          ]}
                        >
                          {app.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "applied":
      return "#0B6EFD";
    case "interview":
      return "#F59E0B";
    case "offer":
      return "#16A34A";
    case "rejected":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    ...typography.bodySmall,
    marginBottom: 4,
  },
  name: {
    ...typography.h2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    ...typography.h3,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  lockBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  lockText: {
    fontSize: 12,
  },
  actionTitle: {
    ...typography.h4,
    marginBottom: 4,
  },
  actionSubtitle: {
    ...typography.caption,
  },
  upgradeCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    color: "white",
    ...typography.h4,
    marginBottom: 4,
  },
  upgradeSubtitle: {
    color: "white",
    ...typography.bodySmall,
    opacity: 0.9,
  },
  upgradePrice: {
    color: "white",
    ...typography.h3,
    fontWeight: "700",
  },
  applicationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  applicationInfo: {
    flex: 1,
  },
  jobTitle: {
    ...typography.h4,
    marginBottom: 4,
  },
  companyName: {
    ...typography.bodySmall,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
