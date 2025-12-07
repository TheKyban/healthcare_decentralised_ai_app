"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the ChatWidget with no SSR to prevent hydration errors
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
} 