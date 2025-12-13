import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Check,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import {
  SUBSCRIPTION_PRICES,
  type SubscriptionTier,
} from "@/types/subscription";
import UpgradeModal from "@/components/UpgradeModal";

const TIER_INFO: Record<
  SubscriptionTier,
  { color: string; icon: string; gradient: string[] }
> = {
  free: {
    color: "#6B7280",
    icon: "🆓",
    gradient: ["#6B7280", "#4B5563"],
  },
  plus: {
    color: "#0B6EFD",
    icon: "⭐",
    gradient: ["#0B6EFD", "#084ECC"],
  },
  pro: {
    color: "#F59E0B",
    icon: "👑",
    gradient: ["#F59E0B", "#D97706"],
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { state, logout } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
            <View
              style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
            >
              <User size={48} color={theme.primary} />
            </View>
            <Text style={[styles.userName, { color: theme.text }]}>
              {state.user.name}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {state.user.email}
            </Text>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: TIER_INFO[state.user.subscription].color + "20" },
              ]}
            >
              <Text style={styles.tierIcon}>
                {TIER_INFO[state.user.subscription].icon}
              </Text>
              <Text
                style={[
                  styles.tierText,
                  { color: TIER_INFO[state.user.subscription].color },
                ]}
              >
                {state.user.subscription.toUpperCase()}
              </Text>
            </View>
          </View>

          {state.user.subscription !== "pro" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Upgrade Your Plan
              </Text>
              {(["plus", "pro"] as const).map((tier) => {
                if (
                  tier === "plus" &&
                  state.user.subscription === "plus"
                )
                  return null;

                return (
                  <TouchableOpacity
                    key={tier}
                    style={[styles.planCard, { backgroundColor: theme.surface }]}
                    onPress={handleUpgrade}
                    activeOpacity={0.7}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={styles.planIcon}>{TIER_INFO[tier].icon}</Text>
                        <View>
                          <Text style={[styles.planName, { color: theme.text }]}>
                            {tier.toUpperCase()}
                          </Text>
                          <Text
                            style={[
                              styles.planPrice,
                              { color: theme.textSecondary },
                            ]}
                          >
                            ${SUBSCRIPTION_PRICES[tier]}/month
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={theme.textSecondary} />
                    </View>

                    <View style={styles.featuresList}>
                      {tier === "plus" && (
                        <>
                          <FeatureItem
                            text="Unlimited resumes & cover letters"
                            theme={theme}
                          />
                          <FeatureItem
                            text="Unlimited job analyses"
                            theme={theme}
                          />
                          <FeatureItem
                            text="Premium templates"
                            theme={theme}
                          />
                          <FeatureItem
                            text="Cloud sync & history"
                            theme={theme}
                          />
                          <FeatureItem
                            text="LinkedIn optimizer"
                            theme={theme}
                          />
                        </>
                      )}
                      {tier === "pro" && (
                        <>
                          <FeatureItem
                            text="Everything in Plus"
                            theme={theme}
                          />
                          <FeatureItem
                            text="AI Interview Simulator"
                            theme={theme}
                            highlight
                          />
                          <FeatureItem
                            text="Chrome auto-apply extension"
                            theme={theme}
                          />
                          <FeatureItem
                            text="Job aggregator & one-click apply"
                            theme={theme}
                          />
                          <FeatureItem
                            text="Priority support"
                            theme={theme}
                          />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Settings
            </Text>
            <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
              <MenuItem
                icon={Settings}
                label="Account Settings"
                theme={theme}
                onPress={() => router.push("/settings")}
              />
              <View
                style={[styles.menuDivider, { backgroundColor: theme.border }]}
              />
              <MenuItem
                icon={HelpCircle}
                label="Help & Support"
                theme={theme}
                onPress={() => router.push("/help")}
              />
              <View
                style={[styles.menuDivider, { backgroundColor: theme.border }]}
              />
              <MenuItem
                icon={LogOut}
                label="Logout"
                theme={theme}
                onPress={handleLogout}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </View>
  );
}

function FeatureItem({
  text,
  theme,
  highlight = false,
}: {
  text: string;
  theme: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.featureItem}>
      <Check size={16} color={highlight ? theme.accent : theme.success} />
      <Text
        style={[
          styles.featureText,
          { color: highlight ? theme.text : theme.textSecondary },
          highlight && { fontWeight: "600" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function MenuItem({
  icon: Icon,
  label,
  theme,
  onPress,
}: {
  icon: any;
  label: string;
  theme: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <Icon
          size={20}
          color={theme.textSecondary}
        />
        <Text
          style={[
            styles.menuLabel,
            { color: theme.text },
          ]}
        >
          {label}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.textSecondary} />
    </TouchableOpacity>
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
  profileCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  userName: {
    ...typography.h3,
    marginBottom: 4,
  },
  userEmail: {
    ...typography.body,
    marginBottom: 16,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierIcon: {
    fontSize: 16,
  },
  tierText: {
    ...typography.bodySmall,
    fontWeight: "700",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planIcon: {
    fontSize: 32,
  },
  planName: {
    ...typography.h4,
    marginBottom: 2,
  },
  planPrice: {
    ...typography.bodySmall,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    ...typography.bodySmall,
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuLabel: {
    ...typography.body,
  },
  menuDivider: {
    height: 1,
    marginLeft: 52,
  },
});
