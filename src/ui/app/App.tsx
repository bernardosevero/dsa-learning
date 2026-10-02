import { BrowserRouter } from "react-router";

import { createAccountService } from "@/storage/accountService";

import { AppDataProvider } from "./AppData";
import { AppRoutes } from "./AppRoutes";

const accountService = createAccountService();

export function App() {
  return (
    <AppDataProvider accountService={accountService}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppDataProvider>
  );
}
