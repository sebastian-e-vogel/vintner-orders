import Link from 'next/link';
import { NavLink } from './NavLink';

const navItems = [
  { href: '/', label: 'New order' },
  { href: '/requests', label: 'Saved requests' },
  { href: '/settings', label: 'Settings' },
];

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-content items-center justify-between px-8 py-3">
        <Link
          href="/"
          className="rounded-md text-lg font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Vintner Orders
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
