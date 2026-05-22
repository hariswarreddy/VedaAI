"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Menu } from "lucide-react";
import { NotificationsButton } from "./NotificationsButton";

export function Topbar({
  title,
  onMenuClick,
  back = true,
}: {
  title: string;
  onMenuClick?: () => void;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="bg-white border-b border-ink-100 sticky top-0 z-20">
      <div className="h-14 px-4 sm:px-6 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-ink-50 text-ink-700"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {back && (
          <button
            onClick={() => router.back()}
            className="hidden sm:inline-flex p-1.5 rounded-md hover:bg-ink-50 text-ink-700"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="text-sm text-ink-700 font-medium truncate">{title}</div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NotificationsButton />

          <div className="hidden sm:flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-ink-50 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 grid place-items-center text-white text-xs font-bold">
              JD
            </div>
            <span className="text-sm text-ink-700">John Doe</span>
            <ChevronDown className="w-4 h-4 text-ink-400" />
          </div>

          <div className="sm:hidden w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 grid place-items-center text-white text-xs font-bold">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
