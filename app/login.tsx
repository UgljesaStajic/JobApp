import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";

WebBrowser.maybeCompleteAuthSession();

// Unused import removed

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const { theme } = useTheme();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [formError, setFormError] = useState<string | null>(null);
  
  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const googleAuthMutation = trpc.auth.googleAuth.useMutation();
  
  const isLoading = registerMutation.isPending || loginMutation.isPending || googleAuthMutation.isPending;

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const handleGoogleAuthResponse = React.useCallback(async (idToken: string) => {
    try {
      setFormError(null);
      // Basic decoding to get user info for optimistic UI or logs
      const parts = idToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      
      const result = await googleAuthMutation.mutateAsync({
        idToken,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
      });
      
      login(result.user as any, result.sessionToken);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Google auth error:", error);
      setFormError(error.message || "Failed to sign in with Google.");
    }
  }, [googleAuthMutation, login, router]);

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleAuthResponse(authentication.idToken);
      }
    }
  }, [response, handleGoogleAuthResponse]);

  const validateForm = () => {
    setFormError(null);
    
    if (!email.trim() || !password) {
      setFormError("Please fill in all required fields.");
      return false;
    }
    
    if (isRegistering && !name.trim()) {
      setFormError("Please enter your name.");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isRegistering) {
        const result = await registerMutation.mutateAsync({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        login(result.user as any, result.sessionToken);
      } else {
        const result = await loginMutation.mutateAsync({
          email: email.trim(),
          password,
        });
        login(result.user as any, result.sessionToken);
      }
      
      // Navigate after successful login
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Auth error:", error);
      setFormError(error.message || "Authentication failed. Please try again.");
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
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="John Doe"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary + '80'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary + '80'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!isRegistering && (
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => Alert.alert("Reset Password", "Password reset instructions sent to your email.")}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

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

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>Or continue with</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => promptAsync()}
            disabled={isLoading}
          >
            <View style={styles.socialIconPlaceholder}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>G</Text>
            </View>
            <Text style={[styles.socialButtonText, { color: theme.text }]}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            By continuing, you agree to our{" "}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Terms</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}> and </Text>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
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
