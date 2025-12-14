import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  Briefcase,
  MapPin,
  DollarSign,
  ExternalLink,
  FileText,
  TrendingUp,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

export default function JobDetailScreen() {
  const { theme } = useTheme();
  const { id, online } = useLocalSearchParams<{ id?: string; online?: string }>();
  const { state } = useApp();
  
  let job = state.jobs.find((j) => j.id === id);
  let isOnlineJob = false;
  
  if (!job && online) {
    try {
      const onlineJob = JSON.parse(decodeURIComponent(online));
      job = onlineJob;
      isOnlineJob = true;
    } catch (error) {
      console.error("Failed to parse online job:", error);
    }
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            Job not found
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const openLink = () => {
    const url = job.url || job.rawJobData?.link || (job as any).link;
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Job Details",
        }}
      />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.header}>
              <View style={[styles.icon, { backgroundColor: theme.primary + "15" }]}>
                <Briefcase size={32} color={theme.primary} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>
                  {job.title}
                </Text>
                <Text style={[styles.company, { color: theme.textSecondary }]}>
                  {job.company}
                </Text>
              </View>
            </View>

            {job.matchScore && (
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
                  size={16}
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
                  {job.matchScore}% Match
                </Text>
              </View>
            )}

            {(job.location || job.rawJobData?.location) && (
              <View style={styles.metaRow}>
                <MapPin size={16} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {job.location || job.rawJobData?.location}
                </Text>
              </View>
            )}

            {job.rawJobData?.salary && (
              <View style={styles.metaRow}>
                <DollarSign size={16} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {job.rawJobData.salary}
                </Text>
              </View>
            )}

            {job.rawJobData?.type && (
              <View style={styles.metaRow}>
                <Briefcase size={16} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {job.rawJobData.type}
                </Text>
              </View>
            )}



            {job.rawJobData?.source && (
              <View style={styles.metaRow}>
                <FileText size={16} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  Source: {job.rawJobData.source}
                </Text>
              </View>
            )}
          </View>

          {(job.description || job.rawJobData?.snippet) && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Job Description</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>
                {job.description || job.rawJobData?.snippet}
              </Text>
            </View>
          )}

          {job.mustHaveSkills && job.mustHaveSkills.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Required Skills
              </Text>
              <View style={styles.skillsGrid}>
                {job.mustHaveSkills.map((skill, index) => (
                  <View
                    key={index}
                    style={[styles.skillTag, { backgroundColor: theme.error + "20" }]}
                  >
                    <Text style={[styles.skillText, { color: theme.error }]}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {job.niceToHave && job.niceToHave.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Nice to Have
              </Text>
              <View style={styles.skillsGrid}>
                {job.niceToHave.map((skill, index) => (
                  <View
                    key={index}
                    style={[styles.skillTag, { backgroundColor: theme.accent + "20" }]}
                  >
                    <Text style={[styles.skillText, { color: theme.accent }]}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Responsibilities
              </Text>
              {job.responsibilities.map((resp, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>{resp}</Text>
                </View>
              ))}
            </View>
          )}

          {isOnlineJob && job && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Full Job Information
              </Text>
              {Object.entries(job)
                .filter(([key]) => key !== 'matchScore' && key !== 'id' && key !== 'updated')
                .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                .map(([key, value]) => {
                  const displayValue = typeof value === 'object' 
                    ? JSON.stringify(value, null, 2) 
                    : String(value);
                  
                  if (!displayValue || displayValue === '' || displayValue === 'undefined') return null;
                  
                  return (
                    <View key={key} style={styles.dataRow}>
                      <Text style={[styles.dataKey, { color: theme.textSecondary }]}>
                        {String(key)}
                      </Text>
                      <Text style={[styles.dataValue, { color: theme.text }]}>
                        {String(displayValue)}
                      </Text>
                    </View>
                  );
                }).filter(Boolean)}
            </View>
          )}

          {!isOnlineJob && job.rawJobData && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Full API Data
              </Text>
              {Object.entries(job.rawJobData)
                .filter(([key]) => key !== 'id' && key !== 'updated')
                .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                .map(([key, value]) => {
                  const displayValue = String(value);
                  if (!displayValue || displayValue === 'undefined') return null;
                  
                  return (
                    <View key={key} style={styles.dataRow}>
                      <Text style={[styles.dataKey, { color: theme.textSecondary }]}>
                        {String(key)}
                      </Text>
                      <Text style={[styles.dataValue, { color: theme.text }]}>
                        {displayValue}
                      </Text>
                    </View>
                  );
                }).filter(Boolean)}
            </View>
          )}

          {(job.url || job.rawJobData?.link || (job as any).link) && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={openLink}
              >
                <ExternalLink size={20} color="white" />
                <Text style={styles.actionButtonText}>View Original Job Posting</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
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
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    gap: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  jobTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  company: {
    ...typography.body,
    fontWeight: "600",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  matchText: {
    ...typography.body,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    ...typography.body,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionContent: {
    ...typography.body,
    lineHeight: 24,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  bulletPoint: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  bullet: {
    ...typography.body,
    fontWeight: "700",
  },
  bulletText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
  dataRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  dataKey: {
    ...typography.bodySmall,
    fontWeight: "700",
    minWidth: 100,
  },
  dataValue: {
    ...typography.bodySmall,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
  },
  actionButtonText: {
    color: "white",
    ...typography.button,
  },
  errorText: {
    ...typography.h3,
    textAlign: "center",
    marginTop: 40,
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
  },
  selectLabel: {
    ...typography.h4,
    marginBottom: 16,
  },
  resumeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  resumeOptionText: {
    ...typography.body,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    ...typography.body,
  },
  resultCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    ...typography.h1,
    fontWeight: "700",
  },
  resultSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultTitle: {
    ...typography.h4,
    marginBottom: 12,
  },
  resultItem: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: 6,
  },
});
