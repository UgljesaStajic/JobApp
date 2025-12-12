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
import { X, Calendar } from "lucide-react-native";

import { typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

interface BillingModalProps {
  visible: boolean;
  onClose: () => void;
}

const MOCK_BILLING_HISTORY = [
  {
    id: "1",
    date: "2024-01-15",
    amount: "$9.99",
    plan: "Plus",
    status: "Paid",
  },
  {
    id: "2",
    date: "2023-12-15",
    amount: "$9.99",
    plan: "Plus",
    status: "Paid",
  },
  {
    id: "3",
    date: "2023-11-15",
    amount: "$9.99",
    plan: "Plus",
    status: "Paid",
  },
];

export default function BillingModal({
  visible,
  onClose,
}: BillingModalProps) {
  const { theme, themeType } = useTheme();

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
              Billing History
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {MOCK_BILLING_HISTORY.map((bill, index) => (
              <View
                key={bill.id}
                style={[
                  styles.billCard,
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={styles.billRow}>
                  <View style={styles.billLeft}>
                    <Calendar size={20} color={theme.textSecondary} />
                    <View style={styles.billInfo}>
                      <Text style={[styles.billDate, { color: theme.text }]}>
                        {bill.date}
                      </Text>
                      <Text
                        style={[
                          styles.billPlan,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {bill.plan} Plan
                      </Text>
                    </View>
                  </View>
                  <View style={styles.billRight}>
                    <Text style={[styles.billAmount, { color: theme.text }]}>
                      {bill.amount}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: theme.success + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: theme.success }]}
                      >
                        {bill.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
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
    maxWidth: 500,
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
    padding: 20,
  },
  billCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  billInfo: {
    flex: 1,
  },
  billDate: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  billPlan: {
    ...typography.caption,
  },
  billRight: {
    alignItems: "flex-end",
  },
  billAmount: {
    ...typography.h4,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
  },
});
