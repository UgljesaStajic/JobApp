import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Edit,
  Trash2,
  Globe,
  X,
  MapPin,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";
import { generateText } from "@rork-ai/toolkit-sdk";

export default function JobsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, deleteJob } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [onlineKeywords, setOnlineKeywords] = useState("");
  const [onlineLocation, setOnlineLocation] = useState("");
  const [onlineJobs, setOnlineJobs] = useState<any[]>([]);
  const [calculatingMatches, setCalculatingMatches] = useState(false);
  const [showOnlineJobs, setShowOnlineJobs] = useState(false);

  const searchJobsMutation = trpc.jobs.searchJobs.useQuery(
    {
      keywords: onlineKeywords,
      location: onlineLocation,
      page: 1,
    },
    {
      enabled: false,
    }
  );

  const filteredJobs = state.jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateMatchScores = useCallback(async (jobs: any[]) => {
    console.log("Calculating match scores for", jobs.length, "jobs");
    
    if (state.resumes.length === 0) {
      console.log("No resumes found, returning 0% match");
      return jobs.map(job => ({ ...job, matchScore: 0 }));
    }

    setCalculatingMatches(true);
    const primaryResume = state.resumes[0];
    
    try {
      const jobsWithScores = await Promise.all(
        jobs.map(async (job) => {
          try {
            const result = await generateText({
              messages: [
                {
                  role: "user",
                  content: `You are a job matching expert. Compare this resume against the job posting and return ONLY a match score from 0-100.

Resume:
Title: ${primaryResume.title}
Skills: ${primaryResume.skills.join(", ")}
Experience: ${primaryResume.experience.map(e => `${e.title} at ${e.company}`).join(", ")}

Job:
Title: ${job.title}
Company: ${job.company}
Description: ${job.snippet || ""}
Location: ${job.location || ""}

Be realistic and honest. Consider:
- Relevant skills match
- Experience level alignment
- Job title relevance
- Industry match

Return ONLY a number between 0-100, nothing else.`,
                },
              ],
            });

            const score = parseInt(result.trim()) || 0;
            const clampedScore = Math.min(Math.max(score, 0), 100);
            console.log(`Match score for ${job.title}: ${clampedScore}%`);
            return { ...job, matchScore: clampedScore };
          } catch (error) {
            console.error("Error calculating match for job:", job.title, error);
            return { ...job, matchScore: 0 };
          }
        })
      );
      
      setCalculatingMatches(false);
      return jobsWithScores;
    } catch (error) {
      console.error("Error calculating match scores:", error);
      setCalculatingMatches(false);
      return jobs.map(job => ({ ...job, matchScore: 0 }));
    }
  }, [state.resumes]);

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
            onPress={() => setShowSearchModal(true)}
          >
            <Globe size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              !showOnlineJobs && [styles.activeTab, { borderBottomColor: theme.primary }],
            ]}
            onPress={() => setShowOnlineJobs(false)}
          >
            <Text
              style={[
                styles.tabText,
                { color: !showOnlineJobs ? theme.primary : theme.textSecondary },
              ]}
            >
              My Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              showOnlineJobs && [styles.activeTab, { borderBottomColor: theme.primary }],
            ]}
            onPress={() => setShowOnlineJobs(true)}
          >
            <Text
              style={[
                styles.tabText,
                { color: showOnlineJobs ? theme.primary : theme.textSecondary },
              ]}
            >
              Search Online
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!showOnlineJobs && filteredJobs.length === 0 ? (
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
          ) : !showOnlineJobs ? (
            <View style={styles.jobsList}>
              {filteredJobs.map((job) => {
                const application = state.applications.find(
                  (app) => app.jobId === job.id
                );

                return (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.jobCard, { backgroundColor: theme.surface }]}
                    onPress={() => {
                      console.log("Open job detail:", job.id);
                      router.push(`/job-detail?id=${job.id}`);
                    }}
                    activeOpacity={0.7}
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
                            onPress={(e) => {
                              e.stopPropagation();
                              console.log("View job:", job.id);
                              router.push(`/job-detail?id=${job.id}`);
                            }}
                          >
                            <Edit size={16} color={theme.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={(e) => {
                              e.stopPropagation();
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
                      {job.mustHaveSkills.slice(0, 3).map((skill: string, index: number) => (
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
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.jobsList}>
              {searchJobsMutation.isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Searching jobs...
                  </Text>
                </View>
              ) : onlineJobs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Globe size={64} color={theme.textSecondary} opacity={0.3} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No online jobs searched yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    Tap the globe icon to search for jobs online
                  </Text>
                </View>
              ) : calculatingMatches ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Calculating resume matches...
                  </Text>
                </View>
              ) : (
                onlineJobs.map((job, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.jobCard, { backgroundColor: theme.surface }]}
                    onPress={() => {
                      router.push(`/job-detail?online=${encodeURIComponent(JSON.stringify(job))}`);
                    }}
                  >
                    <View style={styles.jobHeader}>
                      <View
                        style={[
                          styles.companyIcon,
                          { backgroundColor: theme.accent + "15" },
                        ]}
                      >
                        <Briefcase size={24} color={theme.accent} />
                      </View>
                      <View
                        style={[
                          styles.onlineMatchBadge,
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
                          color={(
                            job.matchScore >= 70
                              ? theme.success
                              : job.matchScore >= 40
                              ? theme.warning
                              : theme.error
                          )}
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
                          {job.matchScore}%
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.jobTitle, { color: theme.text }]}>
                      {job.title}
                    </Text>
                    <Text style={[styles.companyName, { color: theme.textSecondary }]}>
                      {job.company}
                    </Text>

                    <View style={styles.onlineJobMeta}>
                      {job.location && (
                        <View style={styles.metaChip}>
                          <MapPin size={12} color={theme.textSecondary} />
                          <Text style={[styles.metaChipText, { color: theme.textSecondary }]}>
                            {job.location}
                          </Text>
                        </View>
                      )}
                      {job.salary && (
                        <View style={[styles.metaChip, { backgroundColor: theme.success + "15" }]}>
                          <Text style={[styles.salaryText, { color: theme.success }]}>
                            {job.salary}
                          </Text>
                        </View>
                      )}
                    </View>

                    {job.snippet && (
                      <Text
                        style={[styles.jobSnippet, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {job.snippet}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showSearchModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSearchModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Search Jobs Online
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSearchModal(false)}
                >
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Keywords
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="e.g. Software Engineer, Designer..."
                    placeholderTextColor={theme.textSecondary}
                    value={onlineKeywords}
                    onChangeText={setOnlineKeywords}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Location (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="e.g. New York, London..."
                    placeholderTextColor={theme.textSecondary}
                    value={onlineLocation}
                    onChangeText={setOnlineLocation}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    {
                      backgroundColor:
                        !onlineKeywords.trim() || searchJobsMutation.isFetching
                          ? theme.textSecondary
                          : theme.primary,
                    },
                  ]}
                  onPress={async () => {
                    if (!onlineKeywords.trim()) return;

                    try {
                      const result = await searchJobsMutation.refetch();
                      if (result.data) {
                        const jobsWithMatches = await calculateMatchScores(result.data.jobs);
                        setOnlineJobs(jobsWithMatches);
                        setShowOnlineJobs(true);
                        setShowSearchModal(false);
                      }
                    } catch {
                      Alert.alert("Error", "Failed to search jobs. Please try again.");
                    }
                  }}
                  disabled={!onlineKeywords.trim() || searchJobsMutation.isFetching}
                >
                  {searchJobsMutation.isFetching ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Search size={20} color="white" />
                      <Text style={styles.searchButtonText}>Search Jobs</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    ...typography.button,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    textAlign: "center",
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    ...typography.bodySmall,
  },
  onlineMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  onlineJobMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  salaryText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
  },
  jobSnippet: {
    ...typography.bodySmall,
    lineHeight: 20,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    ...typography.body,
  },
  modalContainer: {
    flex: 1,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    ...typography.h3,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    ...typography.h4,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  searchButtonText: {
    color: "white",
    ...typography.button,
  },
});
