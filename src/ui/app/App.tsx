import { BrowserRouter } from "react-router";

import { createSupabase } from "@/storage/supabase";

import { AppDataProvider } from "./AppData";
import { AppRoutes } from "./AppRoutes";

const supabase = createSupabase();

export function App() {
  return (
    <AppDataProvider supabase={supabase}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppDataProvider>
  );
}
