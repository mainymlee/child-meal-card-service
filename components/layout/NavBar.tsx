import Link from "next/link";
import { BackIcon } from "@/components/icons";

interface NavBarProps {
  title: string;
  backHref?: string;
  extra?: React.ReactNode;
  action?: React.ReactNode;
}

export function NavBar({ title, backHref, extra, action }: NavBarProps) {
  return (
    <div className="navbar">
      {backHref ? (
        <Link className="back" href={backHref} aria-label="뒤로">
          <BackIcon />
        </Link>
      ) : null}
      <h5>{title}</h5>
      {extra}
      {action}
    </div>
  );
}
