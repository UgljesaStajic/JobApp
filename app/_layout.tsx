import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/context/AppContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("ErrorBoundary caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {String(this.state.error?.message || "Unknown error")}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutNav() {
  const { state, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!state.isAuthenticated && !inAuthGroup) {
      router.replace("/splash");
    } else if (state.isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [state.isAuthenticated, segments, isLoading, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: "Settings",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="support" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="job-analyzer" 
        options={{ 
          title: "Job Analyzer",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="resume-optimizer" 
        options={{ 
          title: "Resume Optimizer",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="cover-letter" 
        options={{ 
          title: "Cover Letter",
          presentation: "modal"
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0B0B0B",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#E6EEF8",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: "#0B6EFD",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
