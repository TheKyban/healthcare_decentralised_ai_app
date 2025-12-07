"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, MessageSquare, Send, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useChatWidget } from "@/lib/hooks/useChatWidget";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
};

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<HTMLDivElement>(null);
  
  // Get chat widget state from global store
  const { isOpen, isMinimized, toggleChat, closeChat } = useChatWidget();

  // Save/load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("medassist-widget-messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse saved messages:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentStreamingMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("medassist-widget-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleCloseWidget = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeChat();
  };

  const getAIResponse = async (userMessage: string) => {
    setLoading(true);
    setCurrentStreamingMessage("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          category: "General Consultation", // Default category
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = new TextDecoder().decode(value);

        try {
          const jsonData = JSON.parse(chunk);
          if (jsonData.suggestions && jsonData.done) {
            const assistantMessage = {
              role: "assistant" as const,
              content: accumulatedResponse.trim(),
              timestamp: new Date(),
              suggestions: jsonData.suggestions,
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setCurrentStreamingMessage("");
            break;
          }
        } catch {
          accumulatedResponse += chunk;
          setCurrentStreamingMessage(accumulatedResponse);

          if (streamingMessageRef.current) {
            streamingMessageRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        role: "assistant" as const,
        content:
          "I apologize, but I'm having trouble processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    await getAIResponse(input);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    const userMessage = {
      role: "user" as const,
      content: suggestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    await getAIResponse(suggestion);
  };

  return (
    <>
      {/* Chat button */}
      <button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-50 transition-all duration-300",
          isMinimized 
            ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            : "bg-slate-700 text-white -translate-y-2"
        )}
        aria-label="Chat with MedAssist"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
      
      {/* Chat widget */}
      <div 
        className={cn(
          "fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-xl z-40 transition-all duration-300 flex flex-col",
          isOpen ? "opacity-100 translate-y-0 max-h-[500px]" : "opacity-0 translate-y-8 max-h-0 overflow-hidden"
        )}
        style={{ height: isOpen ? '500px' : '0' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-bold">MedAssist Chat</h3>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/patient/dashboard/chat">
              <button
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Open full chat"
                title="Open full chat page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </Link>
            <button 
              onClick={handleCloseWidget}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">How can I help you today?</p>
                <p className="text-xs mt-1 text-slate-500">Ask a medical question to get started</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm max-w-[85%]",
                      message.role === "user"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                        : "bg-white text-slate-800 border border-slate-200"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-1 text-slate-500",
                      message.role === "user" ? "pr-2" : "pl-2"
                    )}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {message.role === "assistant" && message.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1 pl-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-700 hover:bg-slate-50 hover:border-teal-200 transition-all shadow-sm mb-1"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <div ref={index === messages.length - 1 ? messagesEndRef : null} />
                </div>
              ))}
              {currentStreamingMessage && (
                <div className="flex flex-col items-start">
                  <div
                    className="rounded-2xl px-4 py-3 bg-white text-slate-800 border border-slate-200 shadow-sm max-w-[85%]"
                  >
                    <div className="prose prose-slate prose-sm max-w-none">
                      <ReactMarkdown>{currentStreamingMessage}</ReactMarkdown>
                    </div>
                  </div>
                  <div ref={streamingMessageRef} />
                </div>
              )}
              {loading && !currentStreamingMessage && (
                <div className="flex justify-center py-2">
                  <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-teal-500 animate-spin" />
                    <span className="text-xs text-slate-700">Processing...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-3 border-t bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className={cn(
                "p-2 rounded-lg transition-all",
                input.trim() && !loading
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm hover:shadow"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
              aria-label="Send message"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            <p>MedAssist provides general information only.</p>
            <div className="mt-1">
              <Link href="/patient/dashboard/chat" className="text-teal-600 hover:underline">
                Open full chat page
              </Link>
            </div>
          </div>
        </form>
      </div>
    </>
  );
} 