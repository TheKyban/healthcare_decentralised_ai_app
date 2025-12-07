"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ChatInterface from "@/components/Chat/ChatInterface";

interface ChatInterfaceRef {
  sendMessage: (message: string) => void;
}

export default function PatientChatPage() {
  const chatRef = useRef<ChatInterfaceRef>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleTopicClick = (topic: string) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(topic);
    }
  };

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
        <div className="md:col-span-8 h-[80vh]">
          <ChatInterface ref={chatRef} onSuggestionsChange={setSuggestions} />
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <Card className="p-4 border-primary/20 shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-primary">💡</span>
              {suggestions.length > 0
                ? "AI Suggested Questions"
                : "Suggested Topics"}
            </h2>
            <div className="space-y-2">
              {suggestions.length > 0 ? (
                // Dynamic suggestions from AI
                suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all whitespace-normal"
                    onClick={() => handleTopicClick(suggestion)}
                  >
                    <span className="text-sm leading-relaxed break-words">
                      {suggestion}
                    </span>
                  </Button>
                ))
              ) : (
                // Default suggested topics
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all whitespace-normal"
                    onClick={() =>
                      handleTopicClick(
                        "What are the symptoms of a common cold vs. flu?"
                      )
                    }
                  >
                    <span className="text-sm leading-relaxed break-words">
                      What are the symptoms of a common cold vs. flu?
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all whitespace-normal"
                    onClick={() =>
                      handleTopicClick(
                        "How can I manage my blood pressure naturally?"
                      )
                    }
                  >
                    <span className="text-sm leading-relaxed break-words">
                      How can I manage my blood pressure naturally?
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all whitespace-normal"
                    onClick={() =>
                      handleTopicClick(
                        "What vaccines are recommended for my age group?"
                      )
                    }
                  >
                    <span className="text-sm leading-relaxed break-words">
                      What vaccines are recommended for my age group?
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50 transition-all whitespace-normal"
                    onClick={() =>
                      handleTopicClick("How much exercise should I get weekly?")
                    }
                  >
                    <span className="text-sm leading-relaxed break-words">
                      How much exercise should I get weekly?
                    </span>
                  </Button>
                </>
              )}
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
