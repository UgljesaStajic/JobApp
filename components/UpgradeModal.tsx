import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, Check, CreditCard } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { typography } from "@/constants/typography";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import type { SubscriptionTier } from "@/types/subscription";
import { SUBSCRIPTION_PRICES } from "@/types/subscription";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

type PaymentMethod = "stripe" | "paypal" | "applepay";

const PLANS: {
  tier: SubscriptionTier;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    tier: "plus",
    name: "Plus",
    price: SUBSCRIPTION_PRICES.plus,
    description: "For serious job seekers",
    features: [
      "Unlimited resumes & cover letters",
      "Unlimited job analyses",
      "Premium templates",
      "Cloud sync & history",
      "LinkedIn optimizer",
    ],
    popular: true,
  },
  {
    tier: "pro",
    name: "Pro",
    price: SUBSCRIPTION_PRICES.pro,
    description: "Maximum job search power",
    features: [
      "Everything in Plus",
      "AI Interview Simulator",
      "Chrome auto-apply extension",
      "Job aggregator & one-click apply",
      "Priority support",
    ],
  },
];

export default function UpgradeModal({ visible, onClose }: UpgradeModalProps) {
  const { updateSubscription } = useApp();
  const { theme } = useTheme();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedTier) {
      Alert.alert("Error", "Please select a plan");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      updateSubscription(selectedTier);
      Alert.alert(
        "Success!",
        `You've been upgraded to ${selectedTier.toUpperCase()}! (test mode)`,
        [
          {
            text: "OK",
            onPress: () => onClose(),
          },
        ]
      );
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Upgrade Your Plan
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose the plan that fits your needs
          </Text>

          <View style={styles.plansContainer}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.tier}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      selectedTier === plan.tier ? theme.primary : theme.border,
                    borderWidth: selectedTier === plan.tier ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedTier(plan.tier)}
                activeOpacity={0.8}
              >
                {plan.popular && (
                  <View
                    style={[
                      styles.popularBadge,
                      { backgroundColor: theme.accent },
                    ]}
                  >
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>
                    {plan.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.text }]}>
                      ${plan.price}
                    </Text>
                    <Text style={[styles.pricePeriod, { color: theme.textSecondary }]}>
                      /month
                    </Text>
                  </View>
                  <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
                    {plan.description}
                  </Text>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check size={16} color={theme.success} />
                      <Text style={[styles.featureText, { color: theme.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {selectedTier === plan.tier && (
                  <View
                    style={[
                      styles.selectedIndicator,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Check size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedTier && (
            <View style={styles.paymentSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Payment Method
              </Text>

              <View style={styles.paymentMethods}>
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        selectedPayment === "stripe" ? theme.primary : theme.border,
                      borderWidth: selectedPayment === "stripe" ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPayment("stripe")}
                >
                  <CreditCard size={24} color={theme.text} />
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: theme.text }]}>
                      Stripe
                    </Text>
                    <Text style={[styles.paymentDesc, { color: theme.textSecondary }]}>
                      Credit/Debit Card (test)
                    </Text>
                  </View>
                  {selectedPayment === "stripe" && (
                    <Check size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        selectedPayment === "paypal" ? theme.primary : theme.border,
                      borderWidth: selectedPayment === "paypal" ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPayment("paypal")}
                >
                  <Text style={styles.paypalIcon}>P</Text>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: theme.text }]}>
                      PayPal
                    </Text>
                    <Text style={[styles.paymentDesc, { color: theme.textSecondary }]}>
                      PayPal Sandbox (test)
                    </Text>
                  </View>
                  {selectedPayment === "paypal" && (
                    <Check size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        selectedPayment === "applepay" ? theme.primary : theme.border,
                      borderWidth: selectedPayment === "applepay" ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPayment("applepay")}
                >
                  <Text style={styles.appleIcon}></Text>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: theme.text }]}>
                      Apple Pay
                    </Text>
                    <Text style={[styles.paymentDesc, { color: theme.textSecondary }]}>
                      Apple Pay Sandbox (test)
                    </Text>
                  </View>
                  {selectedPayment === "applepay" && (
                    <Check size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  isProcessing && { opacity: 0.7 },
                ]}
                onPress={handleUpgrade}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={["#0B6EFD", "#084ECC"]}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.upgradeButtonText}>
                      Upgrade to {selectedTier.toUpperCase()} — 7-day trial (test)
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
                Test mode: No actual charges will be made. Cancel anytime during
                the trial.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    ...typography.h2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    borderRadius: 20,
    padding: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  popularBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    ...typography.h2,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: "700",
  },
  pricePeriod: {
    ...typography.body,
    marginLeft: 4,
  },
  planDescription: {
    ...typography.bodySmall,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentSection: {
    gap: 16,
  },
  sectionTitle: {
    ...typography.h3,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  paymentDesc: {
    ...typography.bodySmall,
  },
  paypalIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#003087",
  },
  appleIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimer: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 18,
  },
});
