import type { MetadataRoute } from "next";

// Lets learners "Add to Home Screen" so French Daily opens like an app (ROADMAP E3).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "French Daily",
    short_name: "French Daily",
    description: "Learn French by writing real sentences every day.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#2047d3",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
