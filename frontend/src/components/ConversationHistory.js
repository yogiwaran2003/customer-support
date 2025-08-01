import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import { Plus, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

const ConversationHistory = () => {
  const {
    conversations,
    activeConversationId,
    loadConversationHistory,
    startNewConversation,
  } = useChat();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleConversationClick = (conversationId) => {
    if (conversationId !== activeConversationId) {
      loadConversationHistory(conversationId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={startNewConversation}
          className="mt-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          title="New conversation"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Conversations
        </h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors duration-200"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button
          onClick={startNewConversation}
          className="w-full flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          New Conversation
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Start a new conversation to get help
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.conversation_id}
                onClick={() =>
                  handleConversationClick(conversation.conversation_id)
                }
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  activeConversationId === conversation.conversation_id
                    ? "bg-blue-100 border border-blue-200"
                    : "hover:bg-gray-100 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate text-sm">
                      {conversation.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(
                        conversation.updated_at || conversation.created_at
                      )}
                    </p>
                  </div>
                  {activeConversationId === conversation.conversation_id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-2"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
