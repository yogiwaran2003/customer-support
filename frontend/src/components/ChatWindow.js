import React from "react";
import { useChat } from "../context/ChatContext";
import ConversationHistory from "./ConversationHistory";
import MessageList from "./MessageList";
import UserInput from "./UserInput";
import { AlertCircle, X } from "lucide-react";

const ChatWindow = () => {
  const { error, clearError } = useChat();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <ConversationHistory />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Customer Support Chat
              </h1>
              <p className="text-sm text-gray-600">
                Ask questions about orders, products, returns, and more
              </p>
            </div>
            <div className="text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <UserInput />
      </div>
    </div>
  );
};

export default ChatWindow;
