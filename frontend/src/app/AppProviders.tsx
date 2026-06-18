import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider, theme } from "antd";
import frFR from "antd/locale/fr_FR";
import "dayjs/locale/fr";
import type { ReactNode } from "react";
import { brand } from "./theme";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={frFR}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: brand.cyanDeep,
            colorInfo: brand.cyanDeep,
            colorLink: brand.cyanDeep,
            borderRadius: 8,
            fontFamily: brand.fontDisplay,
          },
          components: {
            Menu: {
              darkItemBg: "transparent",
              darkSubMenuItemBg: "transparent",
              darkItemSelectedBg: brand.cyanDeep,
              darkItemSelectedColor: "#ffffff",
            },
          },
        }}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
