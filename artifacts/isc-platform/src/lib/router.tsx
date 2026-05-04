import { Link as RRLink, useLocation as RRUseLocation, useNavigate, useMatch } from "react-router-dom";
import type { ComponentProps } from "react";

type LinkProps = Omit<ComponentProps<typeof RRLink>, "to"> & { href: string };

export function Link({ href, ...props }: LinkProps) {
  return <RRLink to={href} {...props} />;
}

export function useLocation(): [string, (to: string, opts?: { replace?: boolean }) => void] {
  const location = RRUseLocation();
  const navigate = useNavigate();
  return [location.pathname, (to, opts) => navigate(to, { replace: opts?.replace })];
}

export function useRoute(pattern: string): [boolean, Record<string, string> | null] {
  const match = useMatch(pattern);
  if (!match) return [false, null];
  return [true, match.params as Record<string, string>];
}
