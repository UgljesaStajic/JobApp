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
      const apiKey = process.env.EXPO_PUBLIC_JSEARCH_API_KEY;

      if (!apiKey) {
        console.error(
          "[jobs.searchJobs] Missing JSearch API key. Expected env: EXPO_PUBLIC_JSEARCH_API_KEY",
        );
        throw new Error(
          "JSearch API key not configured. Please set EXPO_PUBLIC_JSEARCH_API_KEY.",
        );
      }

      try {
        const url = new URL("https://jsearch.p.rapidapi.com/search");
        
        let query = input.keywords;
        if (input.location) {
          query += ` in ${input.location}`;
        }
        
        url.searchParams.append("query", query);
        url.searchParams.append("page", input.page.toString());
        url.searchParams.append("num_pages", "1");

        console.log("JSearch API request:", url.toString());

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("JSearch API error response:", errorText);
          throw new Error(`JSearch API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("JSearch API response:", JSON.stringify(data, null, 2));

        const jobs = (data.data || []).map((job: any) => {
          let salary = "";
          if (job.job_min_salary && job.job_max_salary) {
            salary = `${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()}`;
          } else if (job.job_salary_period) {
            salary = job.job_salary_period;
          }

          return {
            title: job.job_title || "",
            company: job.employer_name || "Company not specified",
            location: job.job_city && job.job_state 
              ? `${job.job_city}, ${job.job_state}` 
              : job.job_country || "",
            snippet: job.job_description || "",
            salary,
            source: "JSearch",
            type: job.job_employment_type || "",
            link: job.job_apply_link || job.job_google_link || "",
            id: job.job_id || "",
            created: job.job_posted_at_datetime_utc || "",
            category: job.job_occupation || "",
            remote: job.job_is_remote || false,
            logo: job.employer_logo || "",
            ...job,
          };
        });

        return {
          jobs,
          totalCount: jobs.length,
        };
      } catch (error) {
        console.error("JSearch API error:", error);
        throw new Error("Failed to fetch jobs from JSearch API");
      }
    }),
});
