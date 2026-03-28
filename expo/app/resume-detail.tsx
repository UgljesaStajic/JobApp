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
import { useLocalSearchParams, Stack } from "expo-router";
import {
  Edit,
  Save,
  X,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import type { Resume } from "@/types/models";

export default function ResumeDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateResume } = useApp();
  
  const resume = state.resumes.find((r) => r.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState<Resume | null>(null);

  if (!resume) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            Resume not found
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const handleEdit = () => {
    setEditedResume({ ...resume });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedResume) {
      updateResume(id, editedResume);
      Alert.alert("Success", "Resume updated successfully");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedResume(null);
    setIsEditing(false);
  };

  const currentResume = isEditing && editedResume ? editedResume : resume;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Resume Details",
          headerRight: () => (
            <View style={styles.headerActions}>
              {isEditing ? (
                <>
                  <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                    <X size={20} color={theme.error} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                    <Save size={20} color={theme.success} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                  <Edit size={20} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Title</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={editedResume?.title}
                onChangeText={(text) => setEditedResume(prev => prev ? { ...prev, title: text } : null)}
                placeholder="Resume Title"
                placeholderTextColor={theme.textSecondary}
              />
            ) : (
              <Text style={[styles.sectionContent, { color: theme.text }]}>
                {currentResume.title}
              </Text>
            )}
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Experience</Text>
            </View>
            {currentResume.experience.map((exp: { title: string; company: string; startDate: string; endDate?: string; description: string }, index: number) => (
              <View key={index} style={styles.experienceItem}>
                <Text style={[styles.expTitle, { color: theme.text }]}>{exp.title}</Text>
                <Text style={[styles.expCompany, { color: theme.textSecondary }]}>
                  {exp.company}
                </Text>
                <View style={styles.expDates}>
                  <Calendar size={14} color={theme.textSecondary} />
                  <Text style={[styles.expDateText, { color: theme.textSecondary }]}>
                    {exp.startDate} - {exp.endDate || "Present"}
                  </Text>
                </View>
                <Text style={[styles.expDescription, { color: theme.text }]}>
                  {exp.description}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <GraduationCap size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Education</Text>
            </View>
            {currentResume.education.map((edu: { degree: string; school: string; startDate: string; endDate: string }, index: number) => (
              <View key={index} style={styles.educationItem}>
                <Text style={[styles.eduDegree, { color: theme.text }]}>{edu.degree}</Text>
                <Text style={[styles.eduSchool, { color: theme.textSecondary }]}>
                  {edu.school}
                </Text>
                <View style={styles.eduDates}>
                  <Calendar size={14} color={theme.textSecondary} />
                  <Text style={[styles.eduDateText, { color: theme.textSecondary }]}>
                    {edu.startDate} - {edu.endDate}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills</Text>
            </View>
            <View style={styles.skillsGrid}>
              {currentResume.skills.map((skill: string, index: number) => (
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

          {currentResume.tags && currentResume.tags.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
              <View style={styles.tagsGrid}>
                {currentResume.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: theme.primary + "15" }]}
                  >
                    <Text style={[styles.tagText, { color: theme.primary }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Metadata</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Created:</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {currentResume.createdAt.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Updated:</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {currentResume.updatedAt.toLocaleDateString()}
              </Text>
            </View>
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
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionContent: {
    ...typography.body,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    ...typography.body,
  },
  experienceItem: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    gap: 6,
  },
  expTitle: {
    ...typography.h4,
  },
  expCompany: {
    ...typography.body,
    fontWeight: "600",
  },
  expDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expDateText: {
    ...typography.bodySmall,
  },
  expDescription: {
    ...typography.body,
    lineHeight: 22,
    marginTop: 4,
  },
  educationItem: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    gap: 6,
  },
  eduDegree: {
    ...typography.h4,
  },
  eduSchool: {
    ...typography.body,
    fontWeight: "600",
  },
  eduDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eduDateText: {
    ...typography.bodySmall,
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
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  metaLabel: {
    ...typography.body,
  },
  metaValue: {
    ...typography.body,
    fontWeight: "600",
  },
  errorText: {
    ...typography.h3,
    textAlign: "center",
    marginTop: 40,
  },
});
