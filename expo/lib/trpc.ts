import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn(
      "EXPO_PUBLIC_RORK_API_BASE_URL not set, backend features will be unavailable",
    );
    return "https://placeholder.local";
  }

  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log("[tRPC] Fetching:", url);
          const response = await fetch(url, options);
          
          console.log("[tRPC] Response status:", response.status);
          
          if (!response.ok) {
            const text = await response.text();
            console.error("[tRPC] Error response:", text.substring(0, 200));
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
          }
          
          const contentType = response.headers.get("content-type");
          if (!contentType?.includes("application/json")) {
            const text = await response.text();
            console.error("[tRPC] Non-JSON response:", text.substring(0, 200));
            throw new Error(`Expected JSON, got ${contentType}: ${text.substring(0, 100)}`);
          }
          
          return response;
        } catch (error) {
          console.error("[tRPC] Fetch error:", error);
          throw error;
        }
      },
    }),
  ],
});
