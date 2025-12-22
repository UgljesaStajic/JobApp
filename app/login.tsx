import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, AlertCircle } from "lucide-react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";

WebBrowser.maybeCompleteAuthSession();

const auth0Domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
const auth0ClientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;

// Unused import removed

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const { theme } = useTheme();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const auth0AuthMutation = trpc.auth.auth0Login.useMutation();

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'exp',
    ...(Platform.OS === 'web' ? {} : { native: 'exp://redirect' })
  });

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      redirectUri,
      clientId: auth0ClientId,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email'],
      extraParams: {
        screen_hint: isRegistering ? 'signup' : 'login',
      },
    },
    {
      authorizationEndpoint: `https://${auth0Domain}/authorize`,
    }
  );

  const handleAuth0Response = React.useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setFormError(null);
      
      const result = await auth0AuthMutation.mutateAsync({
        code,
        redirectUri,
      });
      
      login(result.user as any, result.sessionToken);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Auth0 auth error:", error);
      setFormError(error.message || "Failed to authenticate with Auth0.");
    } finally {
      setIsLoading(false);
    }
  }, [auth0AuthMutation, login, router, redirectUri]);

  useEffect(() => {
    if (result?.type === "success" && result.params.code) {
      handleAuth0Response(result.params.code);
    } else if (result?.type === "error") {
      setFormError(result.error?.message || "Authentication failed");
    }
  }, [result, handleAuth0Response]);

  const handleSubmit = async () => {
    setFormError(null);
    if (!request) {
      setFormError("Authentication not ready. Please try again.");
      return;
    }
    
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error: any) {
      console.error("Auth error:", error);
      setFormError(error.message || "Authentication failed. Please try again.");
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

          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {isRegistering 
                ? "Create your account securely with Auth0. Click the button below to get started."
                : "Sign in securely with Auth0. Click the button below to continue."}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: isLoading || !request ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading || !request}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.submitContent}>
                <Text style={styles.submitButtonText}>
                  {isRegistering ? "Create Account with Auth0" : "Sign In with Auth0"}
                </Text>
                <ArrowRight size={20} color="white" style={{ marginLeft: 8 }} />
              </View>
            )}
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
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
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
