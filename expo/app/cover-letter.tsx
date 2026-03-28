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

type ToneType = "professional" | "friendly" | "confident" | "creative";
type LengthType = "short" | "standard" | "long";

export default function CoverLetterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, addCoverLetter } = useApp();
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<ToneType>("professional");
  const [length, setLength] = useState<LengthType>("standard");
  const [generatedLetter, setGeneratedLetter] = useState("");

  const features = SUBSCRIPTION_FEATURES[state.user.subscription];
  const canGenerate = features.coverLetters === -1 || state.coverLetters.length < features.coverLetters;

  const generateMutation = useMutation({
    mutationFn: async ({ job, selectedTone, selectedLength }: { job: string; selectedTone: ToneType; selectedLength: LengthType }) => {
      console.log("Generating cover letter...", selectedTone, selectedLength);
      
      const lengthInstructions: Record<LengthType, string> = {
        short: "3-4 sentences, very brief",
        standard: "3-4 paragraphs, ~200-250 words",
        long: "5-6 paragraphs, ~350-400 words"
      };

      const toneInstructions: Record<ToneType, string> = {
        professional: "formal and professional",
        friendly: "warm and personable while remaining professional",
        confident: "assertive and achievement-focused",
        creative: "engaging and unique while staying appropriate"
      };

      const latestResume = state.resumes[state.resumes.length - 1];
      const resumeContext = latestResume ? `\n\nCandidate's Resume:\n${latestResume.content}` : "";

      const result = await generateText({
        messages: [
          {
            role: "user",
            content: `Write a tailored cover letter for ${state.user.name} (${state.user.email}).

Job Description:
${job}
${resumeContext}

Tone: ${toneInstructions[selectedTone]}
Length: ${lengthInstructions[selectedLength]}

Reference 2-3 specific job requirements from the description. Show enthusiasm and fit.
Format: Standard cover letter with greeting, body paragraphs, and closing.`,
          },
        ],
      });

      return result;
    },
    onSuccess: (data) => {
      console.log("Cover letter generated");
      setGeneratedLetter(data);
    },
    onError: (error) => {
      console.error("Generation failed:", error);
    },
  });

  const handleGenerate = () => {
    if (!jobDescription.trim()) {
      return;
    }

    if (!canGenerate) {
      router.push("/(tabs)/profile");
      return;
    }

    generateMutation.mutate({
      job: jobDescription,
      selectedTone: tone,
      selectedLength: length,
    });
  };

  const handleSave = () => {
    if (!generatedLetter) return;

    addCoverLetter({
      jobId: "",
      content: generatedLetter,
      tone,
      length,
    });

    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!canGenerate && (
            <View style={[styles.limitBanner, { backgroundColor: theme.warning + "20" }]}>
              <AlertCircle size={20} color={theme.warning} />
              <Text style={[styles.limitText, { color: theme.warning }]}>
                Cover letter limit reached. Upgrade to Plus for unlimited letters.
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
              numberOfLines={8}
              placeholder="Paste the job description here..."
              placeholderTextColor={theme.textSecondary}
              value={jobDescription}
              onChangeText={setJobDescription}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Tone
            </Text>
            <View style={styles.optionsGrid}>
              {(["professional", "friendly", "confident", "creative"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: tone === t ? theme.primary : theme.surface,
                      borderColor: tone === t ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setTone(t)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: tone === t ? "white" : theme.text },
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Length
            </Text>
            <View style={styles.optionsRow}>
              {(["short", "standard", "long"] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.lengthButton,
                    {
                      backgroundColor: length === l ? theme.accent : theme.surface,
                      borderColor: length === l ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => setLength(l)}
                >
                  <Text
                    style={[
                      styles.lengthText,
                      { color: length === l ? "white" : theme.text },
                    ]}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              {
                backgroundColor: generateMutation.isPending || !jobDescription.trim()
                  ? theme.textSecondary
                  : theme.primary,
              },
            ]}
            onPress={handleGenerate}
            disabled={generateMutation.isPending || !jobDescription.trim()}
          >
            {generateMutation.isPending ? (
              <>
                <ActivityIndicator color="white" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="white" />
                <Text style={styles.generateButtonText}>Generate Cover Letter</Text>
              </>
            )}
          </TouchableOpacity>

          {generatedLetter && (
            <View style={styles.resultsSection}>
              <Text style={[styles.resultsTitle, { color: theme.text }]}>
                Your Cover Letter
              </Text>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.surface },
                ]}
              >
                <FileText size={24} color={theme.accent} />
                <Text style={[styles.resultText, { color: theme.text }]}>
                  {generatedLetter}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.success }]}
                  onPress={handleSave}
                >
                  <CheckCircle2 size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Cover Letter</Text>
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
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionButton: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  optionText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  lengthButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  lengthText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  generateButton: {
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
  generateButtonText: {
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
});
