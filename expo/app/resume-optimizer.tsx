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
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { generateText } from "@rork-ai/toolkit-sdk";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { SUBSCRIPTION_FEATURES } from "@/types/subscription";

type OptimizationMode = "light" | "strong" | "ats";

export default function ResumeOptimizerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, addResume } = useApp();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] = useState<OptimizationMode>("strong");
  const [optimizedText, setOptimizedText] = useState("");

  const features = SUBSCRIPTION_FEATURES[state.user.subscription];
  const canOptimize = features.resumeUploads === -1 || state.resumes.length < features.resumeUploads;

  const optimizeMutation = useMutation({
    mutationFn: async ({ resume, job, optimizationMode }: { resume: string; job: string; optimizationMode: OptimizationMode }) => {
      console.log("Optimizing resume...", optimizationMode);
      
      const modeInstructions: Record<OptimizationMode, string> = {
        light: "Make minimal improvements, focus on grammar and clarity.",
        strong: "Significantly improve the resume with better wording, metrics, and impact statements using STAR method.",
        ats: "Optimize heavily for ATS systems with exact keyword matching and proper formatting."
      };

      const result = await generateText({
        messages: [
          {
            role: "user",
            content: `You are an expert resume writer. ${modeInstructions[optimizationMode]}

IMPORTANT RULES:
- Keep all core facts unchanged (company names, job titles, dates, education)
- Only improve wording and presentation
- Add suggested metrics where they're missing (mark them with [SUGGESTED: add your metric])
- Use STAR method (Situation, Task, Action, Result) for bullet points
- Make it ATS-friendly

Original Resume:
${resume}

${job ? `Target Job Description:\n${job}\n\nTailor the resume to match this job's requirements while keeping facts intact.` : 'Improve the resume generally.'}

Return ONLY the optimized resume text in plain text format, maintaining the original structure.`,
          },
        ],
      });

      return result;
    },
    onSuccess: (data) => {
      console.log("Optimization complete");
      setOptimizedText(data);
    },
    onError: (error) => {
      console.error("Optimization failed:", error);
    },
  });

  const handleOptimize = () => {
    if (!resumeText.trim()) {
      return;
    }

    if (!canOptimize) {
      router.push("/(tabs)/profile");
      return;
    }

    optimizeMutation.mutate({
      resume: resumeText,
      job: jobDescription,
      optimizationMode: mode,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (text: string) => {
      console.log("Parsing resume structure...");
      
      const result = await generateText({
        messages: [
          {
            role: "user",
            content: `Parse this resume and extract structured data. Return ONLY valid JSON in this exact format:
{
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or leave empty for current",
      "description": "Job description"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Resume:
${text}

Return ONLY the JSON object, no other text.`,
          },
        ],
      });

      let parsed;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(result);
        }
      } catch {
        parsed = {
          experience: [],
          education: [],
          skills: [],
        };
      }

      return parsed;
    },
    onSuccess: (structuredData) => {
      console.log("Resume parsed successfully");
      addResume({
        title: `Resume ${new Date().toLocaleDateString()}`,
        content: optimizedText,
        tags: mode === "ats" ? ["ATS-Optimized"] : ["AI-Enhanced"],
        experience: structuredData.experience || [],
        education: structuredData.education || [],
        skills: structuredData.skills || [],
      });
      router.back();
    },
    onError: (error) => {
      console.error("Failed to parse resume:", error);
      addResume({
        title: `Resume ${new Date().toLocaleDateString()}`,
        content: optimizedText,
        tags: mode === "ats" ? ["ATS-Optimized"] : ["AI-Enhanced"],
        experience: [],
        education: [],
        skills: [],
      });
      router.back();
    },
  });

  const handleSave = () => {
    if (!optimizedText) return;
    saveMutation.mutate(optimizedText);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!canOptimize && (
            <View style={[styles.limitBanner, { backgroundColor: theme.warning + "20" }]}>
              <AlertCircle size={20} color={theme.warning} />
              <Text style={[styles.limitText, { color: theme.warning }]}>
                Resume limit reached. Upgrade to Plus for unlimited resumes.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Your Resume
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
              numberOfLines={8}
              placeholder="Paste your resume text here..."
              placeholderTextColor={theme.textSecondary}
              value={resumeText}
              onChangeText={setResumeText}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Target Job (Optional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                  minHeight: 120,
                },
              ]}
              multiline
              numberOfLines={5}
              placeholder="Paste job description to tailor your resume..."
              placeholderTextColor={theme.textSecondary}
              value={jobDescription}
              onChangeText={setJobDescription}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Optimization Mode
            </Text>
            <View style={styles.modeSelector}>
              {(["light", "strong", "ats"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor: mode === m ? theme.primary : theme.surface,
                      borderColor: mode === m ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setMode(m)}
                >
                  <Text
                    style={[
                      styles.modeText,
                      { color: mode === m ? "white" : theme.text },
                    ]}
                  >
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.optimizeButton,
              {
                backgroundColor: optimizeMutation.isPending || !resumeText.trim()
                  ? theme.textSecondary
                  : theme.primary,
              },
            ]}
            onPress={handleOptimize}
            disabled={optimizeMutation.isPending || !resumeText.trim()}
          >
            {optimizeMutation.isPending ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="white" />
                <Text style={styles.optimizeButtonText}>Optimizing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Sparkles size={20} color="white" />
                <Text style={styles.optimizeButtonText}>Optimize Resume</Text>
              </View>
            )}
          </TouchableOpacity>

          {optimizedText && (
            <View style={styles.resultsSection}>
              <Text style={[styles.resultsTitle, { color: theme.text }]}>
                Optimized Resume
              </Text>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.surface },
                ]}
              >
                <FileText size={24} color={theme.primary} />
                <Text style={[styles.resultText, { color: theme.text }]}>
                  {optimizedText}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: saveMutation.isPending ? theme.textSecondary : theme.success }]}
                  onPress={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.saveButtonText}>Parsing...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <CheckCircle2 size={20} color="white" />
                      <Text style={styles.saveButtonText}>Save Resume</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
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
    minHeight: 160,
  },
  modeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  modeText: {
    ...typography.bodySmall,
    fontWeight: "700",
  },
  optimizeButton: {
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
  optimizeButtonText: {
    color: "white",
    ...typography.button,
  },
  resultsSection: {
    gap: 16,
  },
  resultsTitle: {
    ...typography.h3,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  resultText: {
    ...typography.body,
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: "white",
    ...typography.button,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
