import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  TrendingUp,
  Award,
  X,
} from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { generateText } from "@rork-ai/toolkit-sdk";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

interface ComparisonResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  recommendations: string[];
}

export default function JobDetailScreen() {
  const { theme } = useTheme();
  const { id, online } = useLocalSearchParams<{ id?: string; online?: string }>();
  const { state } = useApp();
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  let job = state.jobs.find((j) => j.id === id);
  
  if (!job && online) {
    try {
      const onlineJob = JSON.parse(decodeURIComponent(online));
      job = onlineJob;
    } catch (error) {
      console.error("Failed to parse online job:", error);
    }
  }

  const compareMutation = useMutation({
    mutationFn: async ({ resumeId }: { resumeId: string }) => {
      console.log("Comparing resume with job...");
      const resume = state.resumes.find((r) => r.id === resumeId);
      if (!resume || !job) throw new Error("Resume or job not found");

      const result = await generateText({
        messages: [
          {
            role: "user",
            content: `You are an expert career advisor. Compare this resume against the job posting and provide a detailed analysis.

Resume:
Title: ${resume.title}
Skills: ${resume.skills.join(", ")}
Experience: ${resume.experience.map(e => `${e.title} at ${e.company}: ${e.description}`).join("\n")}
Education: ${resume.education.map(e => `${e.degree} from ${e.school}`).join("\n")}

Job Posting:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description || job.rawJobData?.snippet || "N/A"}
Required Skills: ${job.mustHaveSkills?.join(", ") || "N/A"}
Nice to Have: ${job.niceToHave?.join(", ") || "N/A"}
Responsibilities: ${job.responsibilities?.join(", ") || "N/A"}

Analyze the match and return ONLY valid JSON in this exact format:
{
  "matchScore": 85,
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Skill 3", "Skill 4"],
  "strengths": ["Strength 1", "Strength 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Be honest and specific. Return ONLY the JSON object, no other text.`,
          },
        ],
      });

      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as ComparisonResult;
        }
        return JSON.parse(result) as ComparisonResult;
      } catch {
        return {
          matchScore: 0,
          matchedSkills: [],
          missingSkills: [],
          strengths: [],
          recommendations: [],
        };
      }
    },
    onSuccess: (data) => {
      console.log("Comparison complete");
      setComparisonResult(data);
    },
    onError: (error) => {
      console.error("Comparison failed:", error);
    },
  });

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
    if (job.url || job.rawJobData?.link) {
      Linking.openURL(job.url || job.rawJobData?.link || "");
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

            {(job.rawJobData?.updated || job.createdAt) && (
              <View style={styles.metaRow}>
                <Calendar size={16} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  Posted: {job.rawJobData?.updated || (typeof job.createdAt === 'string' ? job.createdAt : job.createdAt?.toLocaleDateString?.() || 'N/A')}
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

          {job.description && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>
                {job.description}
              </Text>
            </View>
          )}

          {job.rawJobData?.snippet && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Summary</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>
                {job.rawJobData.snippet}
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

          {job.rawJobData && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Full API Data
              </Text>
              {Object.entries(job.rawJobData).map(([key, value]) => (
                <View key={key} style={styles.dataRow}>
                  <Text style={[styles.dataKey, { color: theme.textSecondary }]}>
                    {key}:
                  </Text>
                  <Text style={[styles.dataValue, { color: theme.text }]}>
                    {String(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            {(job.url || job.rawJobData?.link) && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={openLink}
              >
                <ExternalLink size={20} color="white" />
                <Text style={styles.actionButtonText}>View Original</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.accent, opacity: state.resumes.length === 0 ? 0.5 : 1 },
              ]}
              onPress={() => setShowCompareModal(true)}
              disabled={state.resumes.length === 0}
            >
              <Award size={20} color="white" />
              <Text style={styles.actionButtonText}>Compare with Resume</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showCompareModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowCompareModal(false);
            setComparisonResult(null);
          }}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Compare Resume
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowCompareModal(false);
                    setComparisonResult(null);
                  }}
                >
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {!comparisonResult ? (
                <ScrollView style={styles.modalContent}>
                  <Text style={[styles.selectLabel, { color: theme.text }]}>
                    Select a resume to compare:
                  </Text>
                  {state.resumes.map((resume) => (
                    <TouchableOpacity
                      key={resume.id}
                      style={[
                        styles.resumeOption,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                      onPress={() => {
                        compareMutation.mutate({ resumeId: resume.id });
                      }}
                      disabled={compareMutation.isPending}
                    >
                      <FileText size={20} color={theme.primary} />
                      <Text style={[styles.resumeOptionText, { color: theme.text }]}>
                        {resume.title}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {compareMutation.isPending && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={theme.primary} />
                      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Analyzing match...
                      </Text>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <ScrollView style={styles.modalContent}>
                  <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
                    <View
                      style={[
                        styles.scoreCircle,
                        {
                          backgroundColor:
                            comparisonResult.matchScore >= 70
                              ? theme.success + "20"
                              : comparisonResult.matchScore >= 40
                              ? theme.warning + "20"
                              : theme.error + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreText,
                          {
                            color:
                              comparisonResult.matchScore >= 70
                                ? theme.success
                                : comparisonResult.matchScore >= 40
                                ? theme.warning
                                : theme.error,
                          },
                        ]}
                      >
                        {comparisonResult.matchScore}%
                      </Text>
                    </View>
                  </View>

                  {comparisonResult.matchedSkills.length > 0 && (
                    <View style={[styles.resultSection, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.resultTitle, { color: theme.success }]}>
                        ✓ Matched Skills
                      </Text>
                      {comparisonResult.matchedSkills.map((skill, index) => (
                        <Text key={index} style={[styles.resultItem, { color: theme.text }]}>
                          • {skill}
                        </Text>
                      ))}
                    </View>
                  )}

                  {comparisonResult.missingSkills.length > 0 && (
                    <View style={[styles.resultSection, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.resultTitle, { color: theme.error }]}>
                        ✗ Missing Skills
                      </Text>
                      {comparisonResult.missingSkills.map((skill, index) => (
                        <Text key={index} style={[styles.resultItem, { color: theme.text }]}>
                          • {skill}
                        </Text>
                      ))}
                    </View>
                  )}

                  {comparisonResult.strengths.length > 0 && (
                    <View style={[styles.resultSection, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.resultTitle, { color: theme.primary }]}>
                        ★ Your Strengths
                      </Text>
                      {comparisonResult.strengths.map((strength, index) => (
                        <Text key={index} style={[styles.resultItem, { color: theme.text }]}>
                          • {strength}
                        </Text>
                      ))}
                    </View>
                  )}

                  {comparisonResult.recommendations.length > 0 && (
                    <View style={[styles.resultSection, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.resultTitle, { color: theme.accent }]}>
                        💡 Recommendations
                      </Text>
                      {comparisonResult.recommendations.map((rec, index) => (
                        <Text key={index} style={[styles.resultItem, { color: theme.text }]}>
                          • {rec}
                        </Text>
                      ))}
                    </View>
                  )}
                </ScrollView>
              )}
            </SafeAreaView>
          </View>
        </Modal>
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
