export const RESUME_TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary design",
    preview: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=260&fit=crop",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Traditional business format",
    preview: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=200&h=260&fit=crop",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold and unique layout",
    preview: "https://images.unsplash.com/photo-1586281380614-7b8e6f49c7d2?w=200&h=260&fit=crop",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant",
    preview: "https://images.unsplash.com/photo-1586281380923-93e59a49a2d2?w=200&h=260&fit=crop",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium leadership style",
    preview: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=260&fit=crop",
  },
] as const;

export type TemplateId = typeof RESUME_TEMPLATES[number]["id"];
