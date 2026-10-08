import { fileURLToPath } from "node:url";

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// React and React Router, which every page needs before it hydrates.
const REACT_MODULES = /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/;
// The public pages' routes and screens; their imports (shared pieces, primitives, strings) join them.
const PUBLIC_MODULES =
  /src[\\/](root\.tsx|routes[\\/](publicLayout|landing|howItWorks|privacy)\.tsx|ui[\\/]screens[\\/](landing|howItWorks|privacy)[\\/]|ui[\\/]app[\\/](PublicLayout|AppLoading|AnalyticsRouteTracker|DocumentHead)\.tsx)/;

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  build: {
    rolldownOptions: {
      output: {
        // Left alone, the public pages load about 27 small chunks before their first paint, and
        // each request costs a round trip on a phone. These groups make it about 8. Lighthouse
        // budgets in lighthouserc.json hold the count and size.
        codeSplitting: {
          groups: [
            { name: "react", test: REACT_MODULES, priority: 2 },
            { name: "public", test: PUBLIC_MODULES, priority: 1 },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
