import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Filter,
  Edit,
  Trash2,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

export default function JobsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, deleteJob } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = state.jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Jobs</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/job-analyzer")}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search jobs..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Filter size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Briefcase size={64} color={theme.textSecondary} opacity={0.3} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No jobs analyzed yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Analyze your first job posting to get started
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push("/job-analyzer")}
              >
                <Text style={styles.emptyButtonText}>Analyze Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {filteredJobs.map((job) => {
                const application = state.applications.find(
                  (app) => app.jobId === job.id
                );

                return (
                  <View
                    key={job.id}
                    style={[styles.jobCard, { backgroundColor: theme.surface }]}
                  >
                    <View style={styles.jobHeader}>
                      <View
                        style={[
                          styles.companyIcon,
                          { backgroundColor: theme.primary + "15" },
                        ]}
                      >
                        <Briefcase size={24} color={theme.primary} />
                      </View>
                      <View style={styles.headerRight}>
                        <View
                          style={[
                            styles.matchBadge,
                            {
                              backgroundColor:
                                job.matchScore >= 70
                                  ? theme.success + "20"
                                  : job.matchScore >= 40
                                  ? theme.warning + "20"
                                  : theme.error + "20",
                            },
                          ]}
                        >
                          <TrendingUp
                            size={14}
                            color={
                              job.matchScore >= 70
                                ? theme.success
                                : job.matchScore >= 40
                                ? theme.warning
                                : theme.error
                            }
                          />
                          <Text
                            style={[
                              styles.matchText,
                              {
                                color:
                                  job.matchScore >= 70
                                    ? theme.success
                                    : job.matchScore >= 40
                                    ? theme.warning
                                    : theme.error,
                              },
                            ]}
                          >
                            {job.matchScore}% match
                          </Text>
                        </View>
                        <View style={styles.headerActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              console.log("Edit job:", job.id);
                              Alert.alert("Edit Job", "Edit functionality coming soon");
                            }}
                          >
                            <Edit size={16} color={theme.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              Alert.alert(
                                "Delete Job",
                                "Are you sure you want to delete this job analysis?",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => deleteJob(job.id),
                                  },
                                ]
                              );
                            }}
                          >
                            <Trash2 size={16} color={theme.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.jobTitle, { color: theme.text }]}>
                      {job.title}
                    </Text>
                    <Text style={[styles.companyName, { color: theme.textSecondary }]}>
                      {job.company}
                    </Text>

                    <View style={styles.skillsContainer}>
                      {job.mustHaveSkills.slice(0, 3).map((skill, index) => (
                        <View
                          key={index}
                          style={[
                            styles.skillTag,
                            { backgroundColor: theme.accent + "20" },
                          ]}
                        >
                          <Text style={[styles.skillText, { color: theme.accent }]}>
                            {skill}
                          </Text>
                        </View>
                      ))}
                      {job.mustHaveSkills.length > 3 && (
                        <Text
                          style={[
                            styles.moreSkills,
                            { color: theme.textSecondary },
                          ]}
                        >
                          +{job.mustHaveSkills.length - 3}
                        </Text>
                      )}
                    </View>

                    {application && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(application.status) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(application.status) },
                          ]}
                        >
                          {application.status.toUpperCase()}
                        </Text>
                      </View>
                    )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...typography.h2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.body,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: "white",
    ...typography.button,
  },
  jobsList: {
    gap: 16,
  },
  jobCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  matchText: {
    ...typography.caption,
    fontWeight: "700",
  },
  jobTitle: {
    ...typography.h4,
    marginBottom: 4,
  },
  companyName: {
    ...typography.body,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: {
    ...typography.caption,
    fontWeight: "600",
  },
  moreSkills: {
    ...typography.caption,
    alignSelf: "center",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "700",
  },
});
