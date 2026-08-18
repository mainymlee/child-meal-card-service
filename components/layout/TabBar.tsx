"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, HomeIcon, MapIcon, UserIcon } from "@/components/icons";

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/result", label: "지도", Icon: MapIcon },
  { href: "/chat", label: "챗봇", Icon: ChatIcon },
  { href: "/welfare", label: "내정보", Icon: UserIcon },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={pathname === href ? "on" : ""}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
