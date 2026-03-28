import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { ArrowLeft, Mail, MessageSquare, Paperclip } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

export default function SupportScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { theme, themeType } = useTheme();

  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0].uri);
      Alert.alert("Success", "Screenshot attached");
    }
  };

  const handleSubmit = async () => {
    if (!subject || !message) {
      Alert.alert("Error", "Please fill in subject and message");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Thanks!",
        "Your support request was submitted — we'll reply within 24 hours (test).",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }, 1500);
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
            Contact Support
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            We typically respond within 24 hours
          </Text>

          <SurfaceWrapper
            {...surfaceProps}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Your name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Plan</Text>
              <View
                style={[
                  styles.planBadge,
                  { backgroundColor: theme.accent + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.planText,
                    { color: theme.accent, fontWeight: "700" },
                  ]}
                >
                  {state.user.subscription.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Brief description of your issue"
                placeholderTextColor={theme.textSecondary}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Message</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={theme.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Attachment (optional)
              </Text>
              <TouchableOpacity
                style={[
                  styles.attachButton,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handlePickImage}
              >
                <Paperclip size={20} color={theme.textSecondary} />
                <Text style={[styles.attachText, { color: theme.textSecondary }]}>
                  {attachment ? "Screenshot attached" : "Attach screenshot"}
                </Text>
              </TouchableOpacity>
            </View>
          </SurfaceWrapper>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Mail size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.alternativeSection}>
            <Text style={[styles.alternativeTitle, { color: theme.text }]}>
              Other ways to reach us
            </Text>
            <TouchableOpacity
              style={[
                styles.alternativeButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <MessageSquare size={20} color={theme.textSecondary} />
              <Text style={[styles.alternativeText, { color: theme.text }]}>
                Live Chat (coming soon)
              </Text>
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
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 120,
  },
  planBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  planText: {
    ...typography.bodySmall,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  attachText: {
    ...typography.bodySmall,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  alternativeSection: {
    marginTop: 32,
    gap: 16,
  },
  alternativeTitle: {
    ...typography.h4,
    textAlign: "center",
  },
  alternativeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alternativeText: {
    ...typography.body,
    fontWeight: "600",
  },
});
