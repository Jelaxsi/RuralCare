"use client";

import { useEffect, useState } from "react";

type Props = {
  message: string;
};

export function OfflineBanner({ message }: Props) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-16 z-[60] border-b border-amber-500/40 bg-amber-600/90 px-4 py-2 text-center text-sm font-medium text-white"
    >
      {message}
    </div>
  );
}
