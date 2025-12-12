import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import {
  User,
  Mail,
  Globe,
  Palette,
  FileText,
  Download,
  Save,
  Bell,
  Lock,
  CreditCard,
  ChevronRight,
  Check,
  Languages,
  X,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeType } from "@/constants/themes";
import TemplateSelector from "@/components/TemplateSelector";
import LanguageSelector from "@/components/LanguageSelector";
import BillingModal from "@/components/BillingModal";
import UpgradeModal from "@/components/UpgradeModal";
import { getLanguageName } from "@/constants/languages";
import { RESUME_TEMPLATES } from "@/constants/templates";

export default function SettingsScreen() {
  const router = useRouter();
  const { state, isLoading, updatePreferences, updateUser, logout, updateSubscription } = useApp();
  const { theme, themeType } = useTheme();

  const [name, setName] = useState(state.user?.name || "");
  const [email, setEmail] = useState(state.user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (isLoading || !state.preferences) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setTimeout(() => {
      updateUser({ name, email });
      setIsSaving(false);
      Alert.alert("Success", "Profile updated successfully");
    }, 1000);
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    updatePreferences({ theme: newTheme });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
            Alert.alert("Account Deleted", "Your account has been deleted (test mode)");
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Your data export has been prepared and will be sent to your email (test mode)",
      [{ text: "OK" }]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    updatePreferences({ defaultTemplate: templateId });
  };

  const handleLanguageSelect = (languageCode: string) => {
    updatePreferences({ language: languageCode });
  };

  const handleExportFormatSelect = (format: "pdf" | "docx") => {
    updatePreferences({ defaultExportFormat: format });
    setShowExportFormatModal(false);
  };

  const handlePaymentUpdate = () => {
    Alert.alert(
      "Update Payment Method",
      "This will open Stripe/PayPal/Apple Pay payment update form (test mode)",
      [{ text: "OK" }]
    );
    setShowPaymentModal(false);
  };

  const getTemplateName = (id: string) => {
    const template = RESUME_TEMPLATES.find(t => t.id === id);
    return template ? template.name : id;
  };

  const SurfaceWrapper = themeType === "space" ? BlurView : View;
  const surfaceProps = themeType === "space" 
    ? { intensity: 40, tint: "dark" as const }
    : {};

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Profile
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
                <User size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.inputGroup}>
                <Mail size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.menuRow} onPress={() => Alert.alert("LinkedIn OAuth", "Connect your LinkedIn account (test mode)")}>
                <View style={styles.menuLeft}>
                  <Globe size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    LinkedIn OAuth
                  </Text>
                </View>
                <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
                  Not connected
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Save size={18} color="white" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </SurfaceWrapper>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Preferences
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
              <TouchableOpacity style={styles.menuRow} onPress={() => setShowTemplateSelector(true)}>
                <View style={styles.menuLeft}>
                  <FileText size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Default Template
                  </Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
                    {getTemplateName(state.preferences?.defaultTemplate || "modern")}
                  </Text>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.menuRow} onPress={() => setShowExportFormatModal(true)}>
                <View style={styles.menuLeft}>
                  <Download size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Default Export Format
                  </Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
                    {(state.preferences?.defaultExportFormat || "pdf").toUpperCase()}
                  </Text>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <Save size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Resume Auto-save
                  </Text>
                </View>
                <Switch
                  value={state.preferences?.resumeAutoSave ?? true}
                  onValueChange={(value) =>
                    updatePreferences({ resumeAutoSave: value })
                  }
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="white"
                />
              </View>
            </SurfaceWrapper>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Theme
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
              {(["dark", "light", "space"] as ThemeType[]).map(
                (t, index) => (
                  <React.Fragment key={t}>
                    {index > 0 && (
                      <View
                        style={[styles.divider, { backgroundColor: theme.border }]}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={() => handleThemeChange(t)}
                    >
                      <View style={styles.menuLeft}>
                        <Palette size={20} color={theme.textSecondary} />
                        <Text style={[styles.menuText, { color: theme.text }]}>
                          {t === "space" ? "Space" : t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </View>
                      {themeType === t && (
                        <Check size={20} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                )
              )}
            </SurfaceWrapper>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Language
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
              <TouchableOpacity style={styles.menuRow} onPress={() => setShowLanguageSelector(true)}>
                <View style={styles.menuLeft}>
                  <Languages size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    App Language
                  </Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
                    {getLanguageName(state.preferences?.language || "en")}
                  </Text>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            </SurfaceWrapper>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Notifications
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
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <Bell size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Email Notifications
                  </Text>
                </View>
                <Switch
                  value={state.preferences?.emailNotifications ?? true}
                  onValueChange={(value) =>
                    updatePreferences({ emailNotifications: value })
                  }
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="white"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <Bell size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Push Notifications
                  </Text>
                </View>
                <Switch
                  value={state.preferences?.pushNotifications ?? true}
                  onValueChange={(value) =>
                    updatePreferences({ pushNotifications: value })
                  }
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="white"
                />
              </View>
            </SurfaceWrapper>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Billing
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
              <TouchableOpacity style={styles.menuRow} onPress={() => setShowUpgradeModal(true)}>
                <View style={styles.menuLeft}>
                  <CreditCard size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Current Plan
                  </Text>
                </View>
                <View style={styles.menuRight}>
                  <Text
                    style={[
                      styles.menuValue,
                      { color: theme.accent, fontWeight: "600" },
                    ]}
                  >
                    {(state.user?.subscription || "free").toUpperCase()}
                  </Text>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.menuRow} onPress={() => setShowBillingModal(true)}>
                <View style={styles.menuLeft}>
                  <CreditCard size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Billing History
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.menuRow} onPress={() => setShowPaymentModal(true)}>
                <View style={styles.menuLeft}>
                  <CreditCard size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Update Payment Method
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </SurfaceWrapper>
          </View>

          {state.user?.subscription !== "free" && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.warning }]}
                onPress={() =>
                  Alert.alert(
                    "Cancel Subscription",
                    "Are you sure you want to cancel your subscription? You'll retain access until the end of your current billing period.",
                    [
                      { text: "Keep Subscription", style: "cancel" },
                      {
                        text: "Cancel Subscription",
                        style: "destructive",
                        onPress: () => {
                          updateSubscription("free");
                          Alert.alert(
                            "Subscription Cancelled",
                            "Your subscription has been cancelled (test mode)"
                          );
                        },
                      },
                    ]
                  )
                }
              >
                <Text style={[styles.cancelButtonText, { color: theme.warning }]}>
                  Cancel Subscription
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Privacy
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
              <TouchableOpacity style={styles.menuRow} onPress={handleExportData}>
                <View style={styles.menuLeft}>
                  <Download size={20} color={theme.textSecondary} />
                  <Text style={[styles.menuText, { color: theme.text }]}>
                    Export Data
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </SurfaceWrapper>
          </View>



          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.error }]}
              onPress={handleDeleteAccount}
            >
              <Lock size={20} color={theme.error} />
              <Text style={[styles.deleteButtonText, { color: theme.error }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <TemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        currentTemplate={state.preferences?.defaultTemplate || "modern"}
        onSelect={handleTemplateSelect}
      />

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={state.preferences?.language || "en"}
        onSelect={handleLanguageSelect}
      />

      <BillingModal
        visible={showBillingModal}
        onClose={() => setShowBillingModal(false)}
      />

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <Modal
        visible={showExportFormatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportFormatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowExportFormatModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Export Format
              </Text>
              <TouchableOpacity onPress={() => setShowExportFormatModal(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: theme.background }]}
              onPress={() => handleExportFormatSelect("pdf")}
            >
              <Text style={[styles.formatText, { color: theme.text }]}>PDF</Text>
              {state.preferences?.defaultExportFormat === "pdf" && (
                <Check size={20} color={theme.accent} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatOption, { backgroundColor: theme.background }]}
              onPress={() => handleExportFormatSelect("docx")}
            >
              <Text style={[styles.formatText, { color: theme.text }]}>DOCX (Word)</Text>
              {state.preferences?.defaultExportFormat === "docx" && (
                <Check size={20} color={theme.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowPaymentModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Update Payment
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.paymentInfo, { color: theme.textSecondary }]}>
              Choose your payment method:
            </Text>
            <TouchableOpacity
              style={[styles.paymentOption, { backgroundColor: theme.background }]}
              onPress={handlePaymentUpdate}
            >
              <CreditCard size={20} color={theme.textSecondary} />
              <Text style={[styles.paymentText, { color: theme.text }]}>
                Credit/Debit Card (Stripe)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, { backgroundColor: theme.background }]}
              onPress={handlePaymentUpdate}
            >
              <Text style={styles.paypalIcon}>P</Text>
              <Text style={[styles.paymentText, { color: theme.text }]}>
                PayPal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, { backgroundColor: theme.background }]}
              onPress={handlePaymentUpdate}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={[styles.paymentText, { color: theme.text }]}>
                Apple Pay
              </Text>
            </TouchableOpacity>
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuText: {
    ...typography.body,
  },
  menuValue: {
    ...typography.bodySmall,
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0B6EFD",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    ...typography.h3,
  },
  formatOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  formatText: {
    ...typography.body,
    fontSize: 16,
  },
  paymentInfo: {
    ...typography.body,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  paymentText: {
    ...typography.body,
    fontSize: 16,
  },
  paypalIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#003087",
  },
  appleIcon: {
    fontSize: 20,
    fontWeight: "700",
  },
});
