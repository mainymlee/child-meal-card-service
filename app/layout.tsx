import type { Metadata } from "next";
import { BalanceProvider } from "@/lib/hooks/useBalance";
import { DemoHourProvider } from "@/lib/hooks/useDemoHour";
import { OverlayProvider } from "@/lib/overlay/OverlayProvider";
import { CookieSync } from "@/components/CookieSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "한끼",
  description: "오늘 뭐 먹을지, 급식카드 잔액과 복지 혜택까지 챙겨주는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css"
        />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/v10.css" />
      </head>
      <body>
        <BalanceProvider>
          <DemoHourProvider>
            <div id="app" className="appShell">
              <OverlayProvider>
                <CookieSync />
                {children}
              </OverlayProvider>
            </div>
          </DemoHourProvider>
        </BalanceProvider>
      </body>
    </html>
  );
}
