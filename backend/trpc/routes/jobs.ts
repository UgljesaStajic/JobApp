import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export const jobsRouter = createTRPCRouter({
  searchJobs: publicProcedure
    .input(z.object({
      keywords: z.string(),
      location: z.string().optional(),
      page: z.number().default(1),
    }))
    .query(async ({ input }) => {
      const apiKey = process.env.EXPO_PUBLIC_JOOBLE_API_KEY;
      
      if (!apiKey) {
        throw new Error("Jooble API key not configured");
      }

      try {
        const response = await fetch(`https://jooble.org/api/${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keywords: input.keywords,
            location: input.location || "",
            page: input.page.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Jooble API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          jobs: data.jobs || [],
          totalCount: data.totalCount || 0,
        };
      } catch (error) {
        console.error("Jooble API error:", error);
        throw new Error("Failed to fetch jobs from Jooble API");
      }
    }),
});
