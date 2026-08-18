import type { Metadata } from "next";
import { BalanceProvider } from "@/lib/hooks/useBalance";
import "./globals.css";

export const metadata: Metadata = {
  title: "한끼",
  description: "오늘 뭐 먹을지, 급식카드 잔액과 복지 혜택까지 챙겨주는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <BalanceProvider>
          <div className="appShell">{children}</div>
        </BalanceProvider>
      </body>
    </html>
  );
}
