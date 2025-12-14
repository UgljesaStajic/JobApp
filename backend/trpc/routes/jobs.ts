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
      const appId =
        process.env.EXPO_PUBLIC_ADZUNA_APP_ID ??
        process.env.EXPO_PUBLIC_ADZUNA_API_ID ??
        process.env.EXPO_PUBLIC_ADZUNA_APPID ??
        process.env.EXPO_PUBLIC_ADZUNA_ID;
      const appKey =
        process.env.EXPO_PUBLIC_ADZUNA_APP_KEY ??
        process.env.EXPO_PUBLIC_ADZUNA_API_KEY ??
        process.env.EXPO_PUBLIC_ADZUNA_KEY;

      if (!appId || !appKey) {
        console.error(
          "[jobs.searchJobs] Missing Adzuna credentials. Expected envs: EXPO_PUBLIC_ADZUNA_APP_ID + EXPO_PUBLIC_ADZUNA_APP_KEY (or *_API_ID/*_API_KEY)",
        );
        throw new Error(
          "Adzuna API credentials not configured. Please set EXPO_PUBLIC_ADZUNA_APP_ID and EXPO_PUBLIC_ADZUNA_APP_KEY.",
        );
      }

      try {
        const country = "us";
        const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${input.page}`);
        url.searchParams.append("app_id", appId);
        url.searchParams.append("app_key", appKey);
        url.searchParams.append("results_per_page", "30");
        url.searchParams.append("what", input.keywords);
        
        if (input.location) {
          url.searchParams.append("where", input.location);
        }

        console.log("Adzuna API request:", url.toString());

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Adzuna API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Adzuna API response:", JSON.stringify(data, null, 2));

        const jobs = (data.results || []).map((job: any) => ({
          title: job.title || "",
          company: job.company?.display_name || "Company not specified",
          location: job.location?.display_name || "",
          snippet: job.description || "",
          salary: job.salary_min && job.salary_max 
            ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
            : job.salary_min
            ? `From ${job.salary_min.toLocaleString()}`
            : "",
          source: "Adzuna",
          type: job.contract_type || job.contract_time || "",
          link: job.redirect_url || "",
          id: job.id || "",
          created: job.created || "",
          category: job.category?.label || "",
          ...job,
        }));

        return {
          jobs,
          totalCount: data.count || 0,
        };
      } catch (error) {
        console.error("Adzuna API error:", error);
        throw new Error("Failed to fetch jobs from Adzuna API");
      }
    }),
});
