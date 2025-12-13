import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { generateObject } from "@rork-ai/toolkit-sdk";
import { z } from "zod";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { SUBSCRIPTION_FEATURES } from "@/types/subscription";

const JobAnalysisSchema = z.object({
  title: z.string().describe("The job title"),
  company: z.string().describe("The company name"),
  mustHaveSkills: z.array(z.string()).describe("Required skills for the job"),
  niceToHave: z.array(z.string()).describe("Nice to have skills"),
  keywords: z.array(z.string()).describe("ATS keywords found in the job description"),
  responsibilities: z.array(z.string()).describe("Key responsibilities"),
  matchScore: z.number().min(0).max(100).describe("Match score 0-100"),
  matchExplanation: z.string().describe("Brief explanation of the match score"),
});

export default function JobAnalyzerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, addJob } = useApp();
  const [jobDescription, setJobDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState<z.infer<typeof JobAnalysisSchema> | null>(null);

  const features = SUBSCRIPTION_FEATURES[state.user.subscription];
  const canAnalyze = features.jobAnalyses === -1 || state.jobs.length < features.jobAnalyses;

  const analyzeMutation = useMutation({
    mutationFn: async (description: string) => {
      console.log("Analyzing job description...");
      
      const result = await generateObject({
        messages: [
          {
            role: "user",
            content: `You are a professional recruiter and resume editor.
Analyze this job description and extract key information:

${description}

Return structured data with: title, company (extract or use "Unknown Company"), must-have skills, nice-to-have skills, ATS keywords, responsibilities, and a match score (0-100, use 75 as default if you can't determine). Provide a brief match score explanation.`,
          },
        ],
        schema: JobAnalysisSchema,
      });

      return result;
    },
    onSuccess: (data) => {
      console.log("Analysis complete:", data);
      setAnalysisResult(data);
      
      addJob({
        title: data.title,
        company: data.company,
        description: jobDescription,
        parsedKeywords: data.keywords,
        mustHaveSkills: data.mustHaveSkills,
        niceToHave: data.niceToHave,
        responsibilities: data.responsibilities,
        matchScore: data.matchScore,
        matchExplanation: data.matchExplanation,
      });
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
    },
  });

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      return;
    }

    if (!canAnalyze) {
      router.push("/(tabs)/profile");
      return;
    }

    analyzeMutation.mutate(jobDescription);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return theme.success;
    if (score >= 40) return theme.warning;
    return theme.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!canAnalyze && (
            <View style={[styles.limitBanner, { backgroundColor: theme.warning + "20" }]}>
              <AlertCircle size={20} color={theme.warning} />
              <Text style={[styles.limitText, { color: theme.warning }]}>
                Analysis limit reached. Upgrade to Plus for unlimited analyses.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Job Description
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              multiline
              numberOfLines={10}
              placeholder="Paste the job description here..."
              placeholderTextColor={theme.textSecondary}
              value={jobDescription}
              onChangeText={setJobDescription}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              {
                backgroundColor: analyzeMutation.isPending || !jobDescription.trim()
                  ? theme.textSecondary
                  : theme.primary,
              },
            ]}
            onPress={handleAnalyze}
            disabled={analyzeMutation.isPending || !jobDescription.trim()}
          >
            {analyzeMutation.isPending ? (
              <>
                <ActivityIndicator color="white" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="white" />
                <Text style={styles.analyzeButtonText}>Analyze Job</Text>
              </>
            )}
          </TouchableOpacity>

          {analysisResult && (
            <View style={styles.resultsSection}>
              <View
                style={[styles.scoreCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.scoreHeader}>
                  <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                    Match Score
                  </Text>
                  <View
                    style={[
                      styles.scoreCircle,
                      {
                        backgroundColor: getScoreColor(analysisResult.matchScore) + "20",
                      },
                    ]}
                  >
                    <TrendingUp
                      size={24}
                      color={getScoreColor(analysisResult.matchScore)}
                    />
                    <Text
                      style={[
                        styles.scoreValue,
                        { color: getScoreColor(analysisResult.matchScore) },
                      ]}
                    >
                      {analysisResult.matchScore}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.scoreExplanation, { color: theme.text }]}>
                  {analysisResult.matchExplanation}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Job Details
                </Text>
                <View
                  style={[styles.detailCard, { backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Position
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {analysisResult.title}
                  </Text>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                    Company
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {analysisResult.company}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Must-Have Skills
                </Text>
                <View style={styles.tagsContainer}>
                  {analysisResult.mustHaveSkills.map((skill, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <CheckCircle2 size={14} color={theme.primary} />
                      <Text style={[styles.tagText, { color: theme.primary }]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {analysisResult.niceToHave.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Nice to Have
                  </Text>
                  <View style={styles.tagsContainer}>
                    {analysisResult.niceToHave.map((skill, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tag,
                          { backgroundColor: theme.accent + "20" },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: theme.accent }]}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  ATS Keywords
                </Text>
                <View style={styles.tagsContainer}>
                  {analysisResult.keywords.map((keyword, index) => (
                    <View
                      key={index}
                      style={[
                        styles.keywordTag,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.keywordText, { color: theme.text }]}>
                        {keyword}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: theme.success }]}
                onPress={() => router.back()}
              >
                <CheckCircle2 size={20} color="white" />
                <Text style={styles.doneButtonText}>Done</Text>
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
    paddingBottom: 120,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  limitText: {
    flex: 1,
    ...typography.bodySmall,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    ...typography.h4,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    ...typography.body,
    minHeight: 200,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeButtonText: {
    color: "white",
    ...typography.button,
  },
  resultsSection: {
    gap: 20,
  },
  scoreCard: {
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreLabel: {
    ...typography.h4,
  },
  scoreCircle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scoreValue: {
    ...typography.h3,
    fontWeight: "700",
  },
  scoreExplanation: {
    ...typography.body,
    lineHeight: 22,
  },
  detailsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: 12,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.h4,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tagText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  keywordTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  keywordText: {
    ...typography.bodySmall,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  doneButtonText: {
    color: "white",
    ...typography.button,
  },
});
