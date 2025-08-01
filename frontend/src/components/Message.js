import React from "react";
import { Bot, User } from "lucide-react";

const Message = ({ message }) => {
  const isUser = message.sender === "user";
  const isError = message.isError;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex gap-3 mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`max-w-[70%] ${isUser ? "order-1" : "order-2"}`}>
        <div
          className={`p-3 rounded-lg ${
            isUser
              ? "bg-blue-500 text-white ml-auto"
              : isError
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        <div
          className={`text-xs text-gray-500 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {formatTimestamp(message.timestamp)}
          {message.metadata?.response_time && (
            <span className="ml-2">({message.metadata.response_time}ms)</span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center order-2">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;
