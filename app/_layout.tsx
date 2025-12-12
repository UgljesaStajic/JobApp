import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/context/AppContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
