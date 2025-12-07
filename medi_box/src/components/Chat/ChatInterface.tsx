"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  ReactNode,
} from "react";

interface ChatInterfaceProps {
  onSuggestionsChange?: (suggestions: string[]) => void;
}

interface ChatInterfaceRef {
  sendMessage: (message: string) => void;
}

interface Message {
  id: string;
  message: string;
  sender: "user" | "ai";
  timestamp: string;
  streaming?: boolean;
  status?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Helper to format text styling like bold, italic, etc.
function formatTextStyling(text: string): ReactNode {
  if (!text) return "";

  // Split the text by bold markers
  const parts = [];
  const segments = text.split(/(\*\*.*?\*\*)/g);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (segment.startsWith("**") && segment.endsWith("**")) {
      // Bold text
      const boldText = segment.substring(2, segment.length - 2);
      parts.push(
        <strong key={`bold-${i}-${boldText.substring(0, 10)}`}>
          {boldText}
        </strong>
      );
    } else {
      // Regular text
      parts.push(
        <span key={`text-${i}-${segment.substring(0, 10)}`}>{segment}</span>
      );
    }
  }

  return <>{parts}</>;
}

// Helper function to format AI response text with proper styling
function formatAIResponse(text: string): ReactNode {
  if (!text) return "";

  // Handle headings
  let formattedText = text.split("\n").map((line, i) => {
    // H3 headings
    if (line.startsWith("### ")) {
      return (
        <h3
          key={`h3-${i}-${line.substring(4, 20)}`}
          className="text-lg font-semibold mt-4 mb-2"
        >
          {line.substring(4)}
        </h3>
      );
    }
    // H2 headings
    if (line.startsWith("## ")) {
      return (
        <h2
          key={`h2-${i}-${line.substring(3, 20)}`}
          className="text-xl font-bold mt-4 mb-2"
        >
          {line.substring(3)}
        </h2>
      );
    }
    // Empty lines
    if (line.trim() === "") {
      return <br key={`br-${i}-${Math.random()}`} />;
    }
    return line;
  });

  // Group text into paragraphs
  const paragraphs = [];
  let currentParagraph: string[] = [];

  formattedText.forEach((item) => {
    if (typeof item === "string") {
      currentParagraph.push(item);
    } else {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join("\n"));
        currentParagraph = [];
      }
      paragraphs.push(item);
    }
  });

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join("\n"));
  }

  // Process paragraphs
  formattedText = paragraphs.map((paragraph, i) => {
    if (typeof paragraph !== "string") return paragraph;

    // Process paragraphs with bullet points
    if (paragraph.includes("- ") || paragraph.includes("* ")) {
      const bulletItems = paragraph.split(/\n[\-\*] /).filter(Boolean);
      return (
        <ul
          key={`ul-${i}-${paragraph.substring(0, 20)}`}
          className="list-disc pl-5 space-y-1 my-2"
        >
          {bulletItems.map((item, j) => (
            <li key={`li-${i}-${j}-${item.substring(0, 15)}`}>
              {formatTextStyling(item.replace(/^[\-\*] /, ""))}
            </li>
          ))}
        </ul>
      );
    }

    // Process normal paragraphs
    return (
      <p key={`p-${i}-${paragraph.substring(0, 20)}`} className="my-2">
        {formatTextStyling(paragraph)}
      </p>
    );
  });

  return <div className="space-y-1">{formattedText}</div>;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(
  ({ onSuggestionsChange }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [streamingMessage, setStreamingMessage] = useState<string>("");
    const [conversationHistory, setConversationHistory] = useState<
      ConversationMessage[]
    >([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Update parent component when suggestions change
    useEffect(() => {
      if (onSuggestionsChange) {
        onSuggestionsChange(suggestions);
      }
    }, [suggestions, onSuggestionsChange]);

    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages, streamingMessage]);

    // Handle submitting a new message
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!inputMessage.trim() || isLoading) return;

      const messageText = inputMessage.trim();
      setInputMessage("");
      setIsLoading(true);
      setSuggestions([]);

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        message: messageText,
        sender: "user",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Update conversation history
      const newHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: "user" as const, content: messageText },
      ].slice(-10);

      setConversationHistory(newHistory);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            category: "general",
            conversationHistory: newHistory,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error("Failed to get response");

        const reader = response?.body?.getReader();
        const decoder = new TextDecoder();
        const chunks = [];
        let lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 50; // Throttle updates to every 50ms

        // Add placeholder for AI message
        const aiMessageId = `ai-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            message: "",
            sender: "ai" as const,
            timestamp: new Date().toISOString(),
            streaming: true,
          },
        ]);

        while (true) {
          const { done, value } = (await reader?.read()) ?? {
            done: true,
            value: undefined,
          };
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chunks.push(chunk);

          const accumulatedText = chunks.join("");

          // Check for metadata marker
          if (accumulatedText.includes("___METADATA___")) {
            const [textPart, metadataPart] =
              accumulatedText.split("___METADATA___");

            // Final update with complete text
            setStreamingMessage(textPart);

            try {
              const metadata = JSON.parse(metadataPart);
              if (metadata.suggestions) setSuggestions(metadata.suggestions);
            } catch (e) {
              console.error("Failed to parse metadata:", e);
            }
            break;
          }

          // Throttle UI updates to avoid excessive re-renders
          const now = Date.now();
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            setStreamingMessage(accumulatedText);
            lastUpdateTime = now;
          }
        }

        // Ensure final state is set
        const finalText = chunks.join("").split("___METADATA___")[0];

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, message: finalText, streaming: false }
              : msg
          )
        );

        setStreamingMessage("");
        setConversationHistory((prev) =>
          [...prev, { role: "assistant" as const, content: finalText }].slice(
            -10
          )
        );
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error(error);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            message: "Sorry, something went wrong. Please try again.",
            sender: "ai" as const,
            timestamp: new Date().toISOString(),
            status: "error",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    // Expose sendMessage method to parent component
    useImperativeHandle(ref, () => ({
      sendMessage: (message) => {
        setInputMessage(message);
        // Trigger submit after a small delay to ensure state is updated
        setTimeout(() => {
          const form = document.querySelector("form");
          if (form) {
            form.dispatchEvent(
              new Event("submit", { cancelable: true, bubbles: true })
            );
          }
        }, 100);
      },
    }));

    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        {/* Chat header */}
        <div className="px-4 py-3 bg-primary text-primary-foreground flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <h2 className="font-medium">Medical Assistant</h2>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <svg
                className="w-16 h-16 mb-4 text-primary/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-lg font-medium">
                How can I help with your medical concerns today?
              </p>
              <p className="text-sm mt-2">
                Your information remains private and secure
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 ${
                    msg.sender === "user" ? "ml-auto" : "mr-auto"
                  } max-w-[85%]`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    } ${msg.streaming ? "animate-pulse" : ""} ${
                      msg.status === "error" ? "bg-red-100 text-red-900" : ""
                    }`}
                  >
                    {msg.sender === "ai" && !msg.status ? (
                      msg.streaming ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        formatAIResponse(msg.message)
                      )
                    ) : (
                      msg.message
                    )}
                  </div>
                  <div
                    className={`text-xs mt-1 text-muted-foreground ${
                      msg.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}

              {/* Streaming message display */}
              {streamingMessage && (
                <div className="mb-4 mr-auto max-w-[85%]">
                  <div className="p-3 rounded-lg bg-muted text-foreground rounded-bl-none">
                    {formatAIResponse(streamingMessage)}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center w-6 h-6">
                  <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></span>
                </span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M22 2L11 13"></path>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

ChatInterface.displayName = "ChatInterface";

export default ChatInterface;
