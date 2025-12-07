"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ChatInterface from "@/components/Chat/ChatInterface";

export default function PatientChatPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Medical Assistant</h1>
          <Link href="/patient/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        <p className="text-muted-foreground mt-2">
          Ask questions about your health, symptoms, or medical information
        </p>
      </header>

      <main className="max-w-7xl mx-auto grid gap-6 md:grid-cols-12">
        {/* Chat interface - takes up more space */}
        <div className="md:col-span-8 h-[600px]">
          <ChatInterface />
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Suggested Topics</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-4"
                onClick={() => {
                  // You can implement functionality to send these questions automatically
                  console.log("Suggestion clicked");
                }}
              >
                What are the symptoms of a common cold vs. flu?
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-4"
              >
                How can I manage my blood pressure naturally?
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-4"
              >
                What vaccines are recommended for my age group?
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-4"
              >
                How much exercise should I get weekly?
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Important Notes</h2>
            <div className="text-sm space-y-3 text-muted-foreground">
              <p>
                This AI assistant provides general information and is not a
                substitute for professional medical advice.
              </p>
              <p>
                Always consult with your healthcare provider for diagnosis and
                treatment.
              </p>
              <p>
                In case of emergency, call your local emergency services
                immediately.
              </p>
              <p className="text-xs mt-4 border-t pt-4">
                Your conversation is private and securely encrypted.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
