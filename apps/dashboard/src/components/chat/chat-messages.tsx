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

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
            <img src="/favicon.jpg" alt="Foxy" className="w-full h-full object-cover" />
          </div>
          <p className="font-display text-lg font-semibold text-gray-900">
            Hey! I&apos;m Foxy
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Your MCP Factory assistant. How can I help?
          </p>
          <div className="flex flex-col gap-2 mt-4">
            {["Send Sales Cold Emails", "Create an API Key", "Setup my MCP"].map(
              (label) => (
                <button
                  key={label}
                  onClick={() => onButtonClick(label)}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-primary-200 text-primary-600 bg-white hover:bg-primary-50 transition"
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
