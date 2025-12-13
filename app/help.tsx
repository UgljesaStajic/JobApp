import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How does the Job Analyzer preserve my resume facts?",
    answer:
      "The Job Analyzer uses AI to enhance your resume wording and formatting while keeping all your core facts intact. We never change company names, job titles, dates, or factual achievements. Only the presentation and phrasing are optimized to match the job requirements.",
  },
  {
    question: "What is the difference between Plus and Pro?",
    answer:
      "Plus ($9.99/mo) gives you unlimited resumes, cover letters, job analyses, premium templates, and cloud sync. Pro ($19.99-$24.99/mo) includes everything in Plus plus the AI Interview Simulator, Chrome auto-apply extension, job aggregator, and priority support.",
  },
  {
    question: "How do I connect LinkedIn?",
    answer:
      "Go to Settings > Profile and tap on 'LinkedIn OAuth'. You'll be redirected to LinkedIn to authorize the connection. Once connected, we can help optimize your LinkedIn profile and sync your data.",
  },
  {
    question: "How does the interview simulator work?",
    answer:
      "The AI Interview Simulator (Pro feature) conducts mock interviews with voice interaction. It asks relevant questions based on your target role, records your answers, transcribes them using speech-to-text, and provides detailed feedback on clarity, structure (STAR method), and keyword usage.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "To cancel, go to Settings > Billing > Current Plan and select 'Cancel Subscription'. You'll retain access until the end of your current billing period. You can reactivate anytime.",
  },
  {
    question: "How do I delete my data?",
    answer:
      "Go to Settings > Privacy > Delete Account. This permanently removes all your resumes, applications, and personal data from our servers. This action cannot be undone. You can also request a data export before deletion.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { theme, themeType } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const SurfaceWrapper = themeType === "space" ? BlurView : View;
  const surfaceProps =
    themeType === "space" ? { intensity: 40, tint: "dark" as const } : {};

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            Help & FAQ
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Find answers to common questions
          </Text>

          <View style={styles.faqList}>
            {FAQ_DATA.map((item, index) => (
              <SurfaceWrapper
                key={index}
                {...surfaceProps}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.question,
                      { color: theme.text },
                      expandedIndex === index && { color: theme.primary },
                    ]}
                  >
                    {item.question}
                  </Text>
                  {expandedIndex === index ? (
                    <ChevronUp size={20} color={theme.primary} />
                  ) : (
                    <ChevronDown size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
                {expandedIndex === index && (
                  <View style={styles.faqBody}>
                    <View
                      style={[styles.divider, { backgroundColor: theme.border }]}
                    />
                    <Text style={[styles.answer, { color: theme.textSecondary }]}>
                      {item.answer}
                    </Text>
                  </View>
                )}
              </SurfaceWrapper>
            ))}
          </View>

          <View style={styles.contactSection}>
            <Text style={[styles.contactTitle, { color: theme.text }]}>
              Still need help?
            </Text>
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>
              Our support team is here to assist you
            </Text>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/support")}
            >
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h2,
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: 24,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  question: {
    ...typography.body,
    fontWeight: "600",
    flex: 1,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  answer: {
    ...typography.bodySmall,
    lineHeight: 22,
  },
  contactSection: {
    alignItems: "center",
    marginTop: 40,
    paddingTop: 32,
  },
  contactTitle: {
    ...typography.h3,
    marginBottom: 8,
  },
  contactText: {
    ...typography.body,
    marginBottom: 24,
  },
  contactButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
