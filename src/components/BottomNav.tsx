"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/decks", label: "덱", icon: "📚" },
  { href: "/study", label: "학습", icon: "✏️" },
  { href: "/cards", label: "카드", icon: "🗂️" },
  { href: "/stats", label: "통계", icon: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-shrink-0 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                active
                  ? "text-blue-600 font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
