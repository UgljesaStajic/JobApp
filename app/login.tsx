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
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertTriangle, Sparkles } from "lucide-react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";
import Colors from "@/constants/colors";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const { isDark } = useTheme();
  
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API Mutations
  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const googleAuthMutation = trpc.auth.googleAuth.useMutation();
  
  const isLoading = registerMutation.isPending || loginMutation.isPending || googleAuthMutation.isPending;

  // Google Auth Setup
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const handleGoogleAuthResponse = React.useCallback(async (idToken: string) => {
    try {
      setError(null);
      const parts = idToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      
      const result = await googleAuthMutation.mutateAsync({
        idToken,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
      });
      
      login(result.user as any, result.sessionToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Google auth error:", err);
      setError(err.message || "Failed to sign in with Google.");
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

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    // Optional: Clear form or keep it? Keeping it is usually friendlier.
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Validation
    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    
    if (isRegistering && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

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
      
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorMsg = err.message?.toLowerCase() || "";
      
      // Handle "no account" error - auto-switch to registration
      if (
        errorMsg.includes("no account") ||
        errorMsg.includes("no_account") ||
        errorMsg.includes("not found") ||
        err.data?.code === "NOT_FOUND"
      ) {
        setIsRegistering(true);
        setError("No account found. Please create one below.");
        return;
      }
      
      // Handle "already exists" error - auto-switch to login
      if (errorMsg.includes("already exists")) {
        setIsRegistering(false);
        setError("Account already exists. Please sign in.");
        return;
      }
      
      // Handle incorrect password
      if (errorMsg.includes("incorrect password")) {
        setError("Incorrect password. Please try again.");
        return;
      }
      
      setError(err.message || "Authentication failed. Please try again.");
    }
  };

  const currentColors = isDark ? Colors.dark : Colors.light;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: currentColors.surface }]}>
            <LinearGradient
              colors={[currentColors.primary, currentColors.accent]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles color="white" size={32} />
            </LinearGradient>
          </View>
          
          <Text style={[styles.title, { color: currentColors.text }]}>
            {isRegistering ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
            {isRegistering 
              ? "Join us to simplify your job search journey" 
              : "Sign in to continue your progress"}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {error && (
            <View style={[styles.errorCard, { backgroundColor: currentColors.error + '15', borderColor: currentColors.error }]}>
              <AlertTriangle size={20} color={currentColors.error} />
              <Text style={[styles.errorText, { color: currentColors.error }]}>{error}</Text>
            </View>
          )}

          {isRegistering && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                <User size={20} color={currentColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: currentColors.text }]}
                  placeholder="John Doe"
                  placeholderTextColor={currentColors.textSecondary + '80'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentColors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <Mail size={20} color={currentColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentColors.text }]}
                placeholder="you@company.com"
                placeholderTextColor={currentColors.textSecondary + '80'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentColors.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <Lock size={20} color={currentColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentColors.text }]}
                placeholder="••••••••"
                placeholderTextColor={currentColors.textSecondary + '80'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPassword ? (
                  <EyeOff size={20} color={currentColors.textSecondary} />
                ) : (
                  <Eye size={20} color={currentColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!isRegistering && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: currentColors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[currentColors.primary, currentColors.primaryDark]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isRegistering ? "Sign Up" : "Sign In"}
                  </Text>
                  <ArrowRight size={20} color="white" style={styles.submitIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: currentColors.border }]} />
            <Text style={[styles.dividerText, { color: currentColors.textSecondary }]}>or continue with</Text>
            <View style={[styles.line, { backgroundColor: currentColors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
            onPress={() => promptAsync()}
            disabled={isLoading}
          >
             {/* Google "G" Logo - manually drawn with text for simplicity and performance */}
            <View style={styles.googleIconContainer}>
               <Text style={[styles.googleIconText, { color: currentColors.text }]}>G</Text>
            </View>
            <Text style={[styles.socialButtonText, { color: currentColors.text }]}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={[styles.footerLink, { color: currentColors.primary }]}>
              {isRegistering ? " Sign In" : " Sign Up"}
            </Text>
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    padding: 4, // creates the border effect if background matches surface
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: width * 0.7,
  },
  form: {
    marginBottom: 24,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  errorText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
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
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: "100%",
    marginLeft: 12,
    fontSize: 16,
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
    overflow: "hidden",
    shadowColor: "#0B6EFD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 32,
  },
  submitGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  submitIcon: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleIconText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
