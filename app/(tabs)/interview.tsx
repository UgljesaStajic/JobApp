import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Mic,
  Play,
  Award,
  Clock,
  Lock,
  X,
  Briefcase,
  MessageSquare,
  Square,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { SUBSCRIPTION_FEATURES } from "@/types/subscription";

export default function InterviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, addInterviewSession } = useApp();
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [jobInput, setJobInput] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);

  const features = SUBSCRIPTION_FEATURES[state.user.subscription];
  const hasAccess = features.aiInterviewSimulator;

  const handleStartInterview = () => {
    setShowInterviewModal(true);
  };

  const handleBeginInterview = async () => {
    if (!jobInput && !selectedJobId) {
      Alert.alert("Job Required", "Please enter a job title or select an existing job.");
      return;
    }

    console.log("Starting interview for:", jobInput || `Job ID: ${selectedJobId}`);
    setIsProcessing(true);

    setTimeout(() => {
      const questions = generateQuestions(jobInput || "the position");
      setCurrentQuestion(questions[0]);
      setQuestionIndex(0);
      setIsProcessing(false);
    }, 1500);
  };

  const handleRecording = () => {
    if (!isRecording) {
      console.log("Starting recording...");
      setIsRecording(true);
      
      Alert.alert("Recording", "Recording started. Speak your answer clearly.");
    } else {
      console.log("Stopping recording...");
      setIsRecording(false);
      setIsProcessing(true);

      setTimeout(() => {
        const score = Math.floor(Math.random() * 30) + 70;
        const feedback = "Good use of STAR method. Consider adding more specific metrics.";
        
        addInterviewSession({
          jobId: selectedJobId || "custom",
          question: currentQuestion,
          recordingUri: "test://recording.mp3",
          transcript: "[Mock transcript of your answer]",
          score,
          feedback,
          improvedAnswer: "Here's an improved version of your answer with more specific examples and metrics.",
        });

        Alert.alert(
          "Answer Processed",
          `Score: ${score}/100\n\nFeedback: ${feedback}`,
          [
            {
              text: "End Interview",
              onPress: () => {
                setShowInterviewModal(false);
                setJobInput("");
                setSelectedJobId(null);
                setCurrentQuestion("");
                setIsProcessing(false);
              },
            },
            {
              text: "Next Question",
              onPress: () => {
                const questions = generateQuestions(jobInput || "the position");
                const nextIndex = questionIndex + 1;
                if (nextIndex < questions.length) {
                  setCurrentQuestion(questions[nextIndex]);
                  setQuestionIndex(nextIndex);
                  setIsProcessing(false);
                } else {
                  setShowInterviewModal(false);
                  setJobInput("");
                  setSelectedJobId(null);
                  setCurrentQuestion("");
                  setIsProcessing(false);
                }
              },
            },
          ]
        );
      }, 2000);
    }
  };

  const generateQuestions = (jobTitle: string) => [
    `Tell me about yourself and why you're interested in ${jobTitle}.`,
    `What relevant experience do you have for ${jobTitle}?`,
    `Describe a challenging project you worked on. How did you handle it?`,
    `What are your strengths and how do they apply to ${jobTitle}?`,
    `Where do you see yourself in 5 years?`,
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Interview Prep
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!hasAccess && (
            <View
              style={[styles.lockCard, { backgroundColor: theme.primary + "15" }]}
            >
              <Lock size={48} color={theme.primary} />
              <Text style={[styles.lockTitle, { color: theme.text }]}>
                PRO Feature
              </Text>
              <Text style={[styles.lockSubtitle, { color: theme.textSecondary }]}>
                Upgrade to Pro to access AI-powered interview simulator with
                personalized feedback
              </Text>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push("/(tabs)/profile")}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </View>
          )}

          {hasAccess && state.interviewSessions.length === 0 && (
            <View style={styles.emptyState}>
              <Mic size={64} color={theme.textSecondary} opacity={0.3} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Start Your First Interview
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Practice with AI-powered mock interviews and get personalized
                feedback
              </Text>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.primary }]}
                onPress={handleStartInterview}
              >
                <Play size={20} color="white" />
                <Text style={styles.startButtonText}>Start Interview</Text>
              </TouchableOpacity>
            </View>
          )}

          {hasAccess && state.interviewSessions.length > 0 && (
            <>
              <View style={styles.statsRow}>
                <View
                  style={[styles.statCard, { backgroundColor: theme.surface }]}
                >
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: theme.primary + "15" },
                    ]}
                  >
                    <Mic size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {state.interviewSessions.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Sessions
                  </Text>
                </View>

                <View
                  style={[styles.statCard, { backgroundColor: theme.surface }]}
                >
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: theme.success + "15" },
                    ]}
                  >
                    <Award size={24} color={theme.success} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {Math.round(
                      state.interviewSessions.reduce(
                        (acc, s) => acc + s.score,
                        0
                      ) / state.interviewSessions.length
                    )}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Avg Score
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.newSessionButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleStartInterview}
              >
                <Play size={24} color="white" />
                <Text style={styles.newSessionText}>New Interview Session</Text>
              </TouchableOpacity>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Recent Sessions
                </Text>
                {state.interviewSessions.slice(0, 10).map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <View style={styles.sessionHeader}>
                      <View
                        style={[
                          styles.scoreCircle,
                          {
                            backgroundColor:
                              session.score >= 70
                                ? theme.success + "20"
                                : session.score >= 40
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
                                session.score >= 70
                                  ? theme.success
                                  : session.score >= 40
                                  ? theme.warning
                                  : theme.error,
                            },
                          ]}
                        >
                          {session.score}
                        </Text>
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text
                          style={[styles.questionText, { color: theme.text }]}
                          numberOfLines={2}
                        >
                          {session.question}
                        </Text>
                        <View style={styles.sessionMeta}>
                          <Clock size={14} color={theme.textSecondary} />
                          <Text
                            style={[
                              styles.sessionDate,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {new Date(session.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showInterviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {currentQuestion ? "Interview Session" : "Start Interview"}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowInterviewModal(false);
                setJobInput("");
                setSelectedJobId(null);
                setCurrentQuestion("");
                setIsRecording(false);
                setIsProcessing(false);
              }}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {!currentQuestion ? (
              <>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
                  Enter the job position you&apos;re interviewing for:
                </Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  }]}
                  placeholder="e.g., Senior Software Engineer"
                  placeholderTextColor={theme.textSecondary}
                  value={jobInput}
                  onChangeText={setJobInput}
                  multiline
                />

                {state.jobs.length > 0 && (
                  <>
                    <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 20 }]}>
                      Or select from your analyzed jobs:
                    </Text>
                    <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
                      {state.jobs.slice(0, 5).map((job) => (
                        <TouchableOpacity
                          key={job.id}
                          style={[styles.jobOption, {
                            backgroundColor: selectedJobId === job.id ? theme.primary + "20" : theme.background,
                            borderColor: theme.border,
                          }]}
                          onPress={() => {
                            setSelectedJobId(job.id);
                            setJobInput(job.title);
                          }}
                        >
                          <Briefcase size={20} color={theme.textSecondary} />
                          <View style={styles.jobOptionInfo}>
                            <Text style={[styles.jobOptionTitle, { color: theme.text }]}>
                              {job.title}
                            </Text>
                            <Text style={[styles.jobOptionCompany, { color: theme.textSecondary }]}>
                              {job.company}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.beginButton, { backgroundColor: theme.primary }]}
                  onPress={handleBeginInterview}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Play size={20} color="white" />
                      <Text style={styles.beginButtonText}>Begin Interview</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.questionBox, { backgroundColor: theme.background }]}>
                  <MessageSquare size={24} color={theme.accent} />
                  <Text style={[styles.questionDisplay, { color: theme.text }]}>
                    {currentQuestion}
                  </Text>
                </View>

                <View style={styles.recordingControls}>
                  <TouchableOpacity
                    style={[styles.recordButton, { 
                      backgroundColor: isRecording ? theme.error : theme.primary 
                    }]}
                    onPress={handleRecording}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="white" size="large" />
                    ) : isRecording ? (
                      <>
                        <Square size={32} color="white" fill="white" />
                        <Text style={styles.recordButtonText}>Stop Recording</Text>
                      </>
                    ) : (
                      <>
                        <Mic size={32} color="white" />
                        <Text style={styles.recordButtonText}>Start Recording</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
                      <Text style={[styles.recordingText, { color: theme.error }]}>
                        Recording in progress...
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Tap the microphone to record your answer. The AI will evaluate your response using the STAR method and provide feedback.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...typography.h2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  lockCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  lockTitle: {
    ...typography.h3,
    marginTop: 16,
    marginBottom: 8,
  },
  lockSubtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: 24,
  },
  upgradeButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  upgradeButtonText: {
    color: "white",
    ...typography.button,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: 32,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  startButtonText: {
    color: "white",
    ...typography.button,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    ...typography.h2,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.bodySmall,
  },
  newSessionButton: {
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
  newSessionText: {
    color: "white",
    ...typography.button,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 16,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    gap: 16,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    ...typography.h4,
    fontWeight: "700",
  },
  sessionInfo: {
    flex: 1,
  },
  questionText: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDate: {
    ...typography.caption,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalLabel: {
    ...typography.body,
    marginBottom: 12,
  },
  modalInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: "top",
  },
  jobsList: {
    maxHeight: 200,
    marginTop: 12,
  },
  jobOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  jobOptionInfo: {
    flex: 1,
  },
  jobOptionTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  jobOptionCompany: {
    ...typography.bodySmall,
  },
  beginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  beginButtonText: {
    color: "white",
    ...typography.button,
  },
  questionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  questionDisplay: {
    ...typography.h4,
    flex: 1,
    lineHeight: 28,
  },
  recordingControls: {
    alignItems: "center",
    marginBottom: 24,
  },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  recordButtonText: {
    color: "white",
    ...typography.bodySmall,
    fontWeight: "700",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingText: {
    ...typography.body,
    fontWeight: "600",
  },
  instructionText: {
    ...typography.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
});
