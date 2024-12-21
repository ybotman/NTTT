"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Route2Hub() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to /games/gamehub
    router.push("/games/gamehub");
  }, [router]);

  return null; // No need to render anything since we are redirecting
}
