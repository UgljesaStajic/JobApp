import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { AlertCircle } from "lucide-react-native";

import Colors from "@/constants/colors";
import { typography } from "@/constants/typography";

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AlertCircle size={64} color={colors.textSecondary} opacity={0.5} />
        <Text style={[styles.title, { color: colors.text }]}>Page Not Found</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          The page you&apos;re looking for doesn&apos;t exist.
        </Text>

        <Link href="/" style={[styles.link, { backgroundColor: colors.primary }]}>
          <Text style={styles.linkText}>Go Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    ...typography.h2,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: 32,
  },
  link: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  linkText: {
    color: "white",
    ...typography.button,
  },
});
