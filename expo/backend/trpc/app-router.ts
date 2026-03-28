import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { authRouter } from "./routes/auth";
import { jobsRouter } from "./routes/jobs";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  auth: authRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;
