import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import AppProviders from "@/app/AppProviders";
import { router } from "@/app/router";
import "@/i18n";
import { initOffline } from "@/offline/init";
import "./index.css";

initOffline();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
