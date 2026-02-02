"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "./use-chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  onButtonClick: (value: string) => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

export function ChatMessages({ messages, onButtonClick }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const welcomeButtons = ["Send Sales Cold Emails", "Create an API Key", "Setup my MCP"];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Welcome message from Foxy */}
      {messages.length === 0 && (
        <div>
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
              <img src="/favicon.jpg" alt="Foxy" className="w-full h-full object-cover" />
            </div>
            <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-gray-100 text-gray-900">
              Hey! I&apos;m Foxy, your MCP Factory assistant. How can I help?
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 ml-9">
            {welcomeButtons.map((label) => (
              <button
                key={label}
                onClick={() => onButtonClick(label)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-primary-200 text-primary-600 bg-white hover:bg-primary-50 transition"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id}>
          <div
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
                <img src="/favicon.jpg" alt="Foxy" className="w-full h-full object-cover" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content ? (
                msg.role === "assistant" ? (
                  <div className="max-w-none [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:mt-1 [&>ul]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:mt-1 [&>ol]:mb-0 [&>ol]:list-decimal [&>ol]:pl-4 [&_strong]:font-semibold [&_li]:mt-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )
              ) : (
                msg.isStreaming ? <TypingIndicator /> : null
              )}
            </div>
          </div>

          {/* Quick-reply buttons */}
          {msg.buttons && msg.buttons.length > 0 && !msg.isStreaming && (
            <div className="flex flex-wrap gap-2 mt-2 ml-9">
              {msg.buttons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => onButtonClick(btn.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-primary-200 text-primary-600 bg-white hover:bg-primary-50 transition"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
