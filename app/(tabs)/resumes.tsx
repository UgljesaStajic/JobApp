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
import { useRouter } from "expo-router";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Tag,
  Download,
  Edit,
  Trash2,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { SUBSCRIPTION_FEATURES } from "@/types/subscription";

export default function ResumesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, deleteResume } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const features = SUBSCRIPTION_FEATURES[state.user.subscription];
  const canAddMore =
    features.resumeUploads === -1 ||
    state.resumes.length < features.resumeUploads;

  const filteredResumes = state.resumes.filter(
    (resume) =>
      resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resume.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Resumes</Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: canAddMore
                  ? theme.primary
                  : theme.textSecondary,
              },
            ]}
            onPress={() => {
              if (canAddMore) {
                router.push("/resume-optimizer");
              } else {
                router.push("/(tabs)/profile");
              }
            }}
            disabled={!canAddMore}
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
              placeholder="Search resumes..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!canAddMore && (
            <TouchableOpacity
              style={[styles.limitBanner, { backgroundColor: theme.warning + "20" }]}
              onPress={() => router.push("/profile")}
            >
              <Text style={[styles.limitText, { color: theme.warning }]}>
                Resume limit reached. Upgrade to Plus for unlimited resumes.
              </Text>
            </TouchableOpacity>
          )}

          {filteredResumes.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={64} color={theme.textSecondary} opacity={0.3} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No resumes yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Create your first resume to get started
              </Text>
              {canAddMore && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push("/resume-optimizer")}
                >
                  <Text style={styles.emptyButtonText}>Create Resume</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.resumesList}>
              {filteredResumes.map((resume) => (
                <TouchableOpacity
                  key={resume.id}
                  style={[styles.resumeCard, { backgroundColor: theme.surface }]}
                  onPress={() => {
                    console.log("Open resume:", resume.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.resumeHeader}>
                    <View
                      style={[
                        styles.resumeIcon,
                        { backgroundColor: theme.primary + "15" },
                      ]}
                    >
                      <FileText size={24} color={theme.primary} />
                    </View>
                    <View style={styles.headerActions}>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => {
                          console.log("Edit resume:", resume.id);
                          Alert.alert("Edit Resume", "Edit functionality coming soon");
                        }}
                      >
                        <Edit size={18} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => {
                          Alert.alert(
                            "Delete Resume",
                            "Are you sure you want to delete this resume?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => deleteResume(resume.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={18} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.resumeTitle, { color: theme.text }]}>
                    {resume.title}
                  </Text>

                  <View style={styles.resumeMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                        {new Date(resume.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {resume.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {resume.tags.slice(0, 3).map((tag, index) => (
                        <View
                          key={index}
                          style={[
                            styles.tag,
                            { backgroundColor: theme.accent + "20" },
                          ]}
                        >
                          <Tag size={12} color={theme.accent} />
                          <Text style={[styles.tagText, { color: theme.accent }]}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.resumeActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.primary + "15" },
                      ]}
                    >
                      <Download size={16} color={theme.primary} />
                      <Text style={[styles.actionText, { color: theme.primary }]}>
                        Export
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBox: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  limitBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  limitText: {
    ...typography.bodySmall,
    fontWeight: "600",
    textAlign: "center",
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
  resumesList: {
    gap: 16,
  },
  resumeCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resumeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  resumeTitle: {
    ...typography.h4,
    marginBottom: 8,
  },
  resumeMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    ...typography.caption,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    ...typography.caption,
    fontWeight: "600",
  },
  resumeActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
});
