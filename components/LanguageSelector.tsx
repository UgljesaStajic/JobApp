import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { X, Check } from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { LANGUAGES } from "@/constants/languages";

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelect: (languageCode: string) => void;
}

export default function LanguageSelector({
  visible,
  onClose,
  currentLanguage,
  onSelect,
}: LanguageSelectorProps) {
  const { theme, themeType } = useTheme();

  const handleSelect = (languageCode: string) => {
    onSelect(languageCode);
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
              Select Language
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {LANGUAGES.map((language, index) => (
              <React.Fragment key={language.code}>
                {index > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: theme.border }]}
                  />
                )}
                <TouchableOpacity
                  style={styles.languageItem}
                  onPress={() => handleSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.flag}>{language.flag}</Text>
                    <Text style={[styles.languageName, { color: theme.text }]}>
                      {language.name}
                    </Text>
                  </View>
                  {currentLanguage === language.code && (
                    <Check size={20} color={theme.accent} />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))}
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
    maxWidth: 400,
    maxHeight: "70%",
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
    padding: 8,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  flag: {
    fontSize: 28,
  },
  languageName: {
    ...typography.body,
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
});
