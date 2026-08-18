import Link from "next/link";
import { BackIcon } from "@/components/icons";

interface NavBarProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function NavBar({ title, backHref, action }: NavBarProps) {
  return (
    <div className="navbar">
      {backHref ? (
        <Link className="back" href={backHref} aria-label="뒤로">
          <BackIcon />
        </Link>
      ) : null}
      <h5>{title}</h5>
      {action}
    </div>
  );
}
