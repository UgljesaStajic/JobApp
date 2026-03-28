export type ThemeType = "dark" | "light" | "space";

export interface Theme {
  primary: string;
  primaryDark: string;
  accent: string;
  accentDark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  glassBlur?: number;
  glassOpacity?: number;
  foldersBackground?: string;
}



const darkTheme: Theme = {
  primary: "#0B6EFD",
  primaryDark: "#084ECC",
  accent: "#00C2A8",
  accentDark: "#00957A",
  background: "#0B0B0B",
  surface: "#0F1113",
  text: "#E6EEF8",
  textSecondary: "#9CA3AF",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "rgba(255,255,255,0.04)",
  tint: "#0B6EFD",
  tabIconDefault: "#6B7280",
  tabIconSelected: "#00C2A8",
  foldersBackground: "#101214",
};

const lightTheme: Theme = {
  primary: "#0B6EFD",
  primaryDark: "#084ECC",
  accent: "#00C2A8",
  accentDark: "#00957A",
  background: "#F7F9FC",
  surface: "#FFFFFF",
  text: "#0B1020",
  textSecondary: "#6B7280",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E5E7EB",
  tint: "#0B6EFD",
  tabIconDefault: "#9CA3AF",
  tabIconSelected: "#0B6EFD",
  foldersBackground: "#F0F3F7",
};

const spaceTheme: Theme = {
  primary: "#00D9FF",
  primaryDark: "#00A8CC",
  accent: "#B026FF",
  accentDark: "#8B1FCC",
  background: "#0A0E27",
  surface: "#141B3D",
  text: "#FFFFFF",
  textSecondary: "#8B93B8",
  success: "#00FF9D",
  warning: "#FFB800",
  error: "#FF3B6D",
  border: "#1E2749",
  tint: "#00D9FF",
  tabIconDefault: "#5A6489",
  tabIconSelected: "#00D9FF",
  glassBlur: 20,
  glassOpacity: 0.15,
  foldersBackground: "#0F1530",
};

export const themes: Record<ThemeType, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  space: spaceTheme,
};

export function getTheme(themeType: ThemeType): Theme {
  return themes[themeType];
}
