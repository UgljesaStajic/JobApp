import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { X, Check } from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { RESUME_TEMPLATES } from "@/constants/templates";

interface TemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentTemplate: string;
  onSelect: (templateId: string) => void;
}

export default function TemplateSelector({
  visible,
  onClose,
  currentTemplate,
  onSelect,
}: TemplateSelectorProps) {
  const { theme, themeType } = useTheme();

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    onClose();
  };

  const SurfaceWrapper = themeType === "space" ? BlurView : View;
  const surfaceProps = themeType === "space" 
    ? { intensity: 60, tint: "dark" as const }
    : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <SurfaceWrapper
          {...surfaceProps}
          style={[
            styles.modalContent,
            { backgroundColor: theme.surface },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Select Template
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.templateGrid}>
              {RESUME_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    { backgroundColor: theme.background },
                    currentTemplate === template.id && {
                      borderColor: theme.accent,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => handleSelect(template.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: template.preview }}
                    style={styles.templatePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: theme.text }]}>
                      {template.name}
                    </Text>
                    <Text
                      style={[
                        styles.templateDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {template.description}
                    </Text>
                  </View>
                  {currentTemplate === template.id && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      <Check size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SurfaceWrapper>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    ...typography.h3,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  templateCard: {
    width: "48%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  templatePreview: {
    width: "100%",
    height: 160,
    backgroundColor: "#E5E7EB",
  },
  templateInfo: {
    padding: 12,
  },
  templateName: {
    ...typography.h4,
    marginBottom: 4,
  },
  templateDescription: {
    ...typography.caption,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
