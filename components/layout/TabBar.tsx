"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, HomeIcon, MapIcon, UserIcon } from "@/components/icons";

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon, isActive: (p: string) => p === "/" },
  {
    href: "/result",
    label: "지도",
    Icon: MapIcon,
    isActive: (p: string) => p === "/result" || p.startsWith("/cvs"),
  },
  { href: "/chat", label: "챗봇", Icon: ChatIcon, isActive: (p: string) => p === "/chat" },
  {
    href: "/me",
    label: "내정보",
    Icon: UserIcon,
    isActive: (p: string) => p === "/me" || p.startsWith("/welfare"),
  },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map(({ href, label, Icon, isActive }) => (
        <Link key={href} href={href} className={isActive(pathname) ? "on" : ""}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
