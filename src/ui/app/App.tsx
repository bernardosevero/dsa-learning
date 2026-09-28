import { BrowserRouter } from "react-router";

import { AppDataProvider } from "./AppData";
import { AppRoutes } from "./AppRoutes";

export function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppDataProvider>
  );
}
