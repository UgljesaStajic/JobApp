import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { getTheme, type Theme, type ThemeType } from "@/constants/themes";

export function useTheme(): { theme: Theme; themeType: ThemeType; isDark: boolean } {
  const appContext = useApp();
  const themeType = appContext?.state?.preferences?.theme ?? "light";

  const theme = useMemo(() => getTheme(themeType), [themeType]);
  const isDark = themeType === "dark" || themeType === "space";

  return { theme, themeType, isDark };
}
