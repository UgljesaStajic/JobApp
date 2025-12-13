import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { getTheme, type Theme, type ThemeType } from "@/constants/themes";

export function useTheme(): { theme: Theme; themeType: ThemeType } {
  const appContext = useApp();
  const themeType = appContext?.state?.preferences?.theme ?? "light";

  const theme = useMemo(() => getTheme(themeType), [themeType]);

  return { theme, themeType };
}
