import { BrowserRouter } from "react-router";

import { createBackend } from "@/storage/backend";

import { AppDataProvider } from "./AppData";
import { AppRoutes } from "./AppRoutes";

const backend = createBackend();

export function App() {
  return (
    <AppDataProvider accountService={backend?.accountService} remoteStore={backend?.remoteStore}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppDataProvider>
  );
}
