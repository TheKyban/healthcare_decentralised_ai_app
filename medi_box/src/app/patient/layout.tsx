"use client";

import FloatingChatButton from "@/components/FloatingChatButton";

export default function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <FloatingChatButton />
    </>
  );
} 