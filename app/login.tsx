import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, AlertCircle, Mail, Lock, User } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const { theme } = useTheme();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const MINIMUM_DELAY = 3;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();

  const handleSubmit = async () => {
    setFormError(null);
    
    if (!email || !password || (isRegistering && !fullName)) {
      setFormError("Please fill in all fields");
      return;
    }
    
    const now = Date.now();
    const timeSinceLastAttempt = (now - lastAttemptTime) / 1000;
    
    const requiredDelay = Math.max(MINIMUM_DELAY, cooldownSeconds);
    if (lastAttemptTime > 0 && timeSinceLastAttempt < requiredDelay) {
      const waitTime = Math.ceil(requiredDelay - timeSinceLastAttempt);
      setFormError(`Please wait ${waitTime} seconds before trying again`);
      return;
    }
    
    try {
      setIsLoading(true);
      setLastAttemptTime(now);
      
      let result;
      if (isRegistering) {
        result = await registerMutation.mutateAsync({
          email,
          password,
          name: fullName || email.split("@")[0],
        });
      } else {
        result = await loginMutation.mutateAsync({
          email,
          password,
        });
      }
      
      setCooldownSeconds(0);
      login(result.user as any, result.sessionToken);
      router.replace("/(tabs)");
    } catch (error: any) {
      const errorMessage = error.message || "Authentication failed. Please try again.";
      
      const rateLimitMatch = errorMessage.match(/after (\d+) seconds/);
      if (rateLimitMatch) {
        const seconds = parseInt(rateLimitMatch[1], 10);
        setCooldownSeconds(seconds + 2);
        setFormError(`Too many attempts. Please wait ${seconds} seconds before trying again.`);
      } else if (errorMessage.includes("security purposes") || errorMessage.includes("rate limit")) {
        setCooldownSeconds(45);
        setFormError("Too many attempts. Please wait 45 seconds and try again.");
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
      <StatusBar barStyle={theme.background === "#0B1020" ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Text style={styles.logoText}>JP</Text>
          </LinearGradient>
          
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            {isRegistering ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={[styles.subtitleText, { color: theme.textSecondary }]}>
            {isRegistering 
              ? "Sign up to start your career journey" 
              : "Sign in to access your applications"}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            style={[styles.tab, !isRegistering && { backgroundColor: theme.primary + '15' }]}
            onPress={() => {
              setIsRegistering(false);
              setFormError(null);
              setFullName("");
            }}
          >
            <Text style={[
              styles.tabText, 
              { color: !isRegistering ? theme.primary : theme.textSecondary, fontWeight: !isRegistering ? "700" : "500" }
            ]}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, isRegistering && { backgroundColor: theme.primary + '15' }]}
            onPress={() => {
              setIsRegistering(true);
              setFormError(null);
            }}
          >
            <Text style={[
              styles.tabText, 
              { color: isRegistering ? theme.primary : theme.textSecondary, fontWeight: isRegistering ? "700" : "500" }
            ]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        <View style={styles.formContainer}>
          {formError && (
            <View style={[styles.errorContainer, { backgroundColor: theme.error + '15', borderColor: theme.error }]}>
              <AlertCircle size={20} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>{formError}</Text>
            </View>
          )}

          {isRegistering && (
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.submitContent}>
                <Text style={styles.submitButtonText}>
                  {isRegistering ? "Create Account" : "Sign In"}
                </Text>
                <ArrowRight size={20} color="white" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.authInfoContainer}>
            <Text style={[styles.authInfoText, { color: theme.textSecondary }]}>
              Secured by Supabase
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            By continuing, you agree to our{" "}
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Terms
            </Text>
            {" and "}
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: '80%',
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginBottom: 24,
    height: 50,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabText: {
    fontSize: 16,
  },
  formContainer: {
    width: "100%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  authInfoContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  authInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  submitContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  socialIconPlaceholder: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "auto",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "700",
  },
});
