import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import axios from "axios";

// Create context
const ChatContext = createContext();

// Action types
const CHAT_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  ADD_MESSAGE: "ADD_MESSAGE",
  SET_MESSAGES: "SET_MESSAGES",
  SET_INPUT_VALUE: "SET_INPUT_VALUE",
  SET_CONVERSATION_ID: "SET_CONVERSATION_ID",
  SET_CONVERSATIONS: "SET_CONVERSATIONS",
  ADD_CONVERSATION: "ADD_CONVERSATION",
  SET_ACTIVE_CONVERSATION: "SET_ACTIVE_CONVERSATION",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Initial state
const initialState = {
  messages: [],
  conversations: [],
  activeConversationId: null,
  inputValue: "",
  isLoading: false,
  error: null,
  userId: "anonymous", // In a real app, this would come from authentication
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };

    case CHAT_ACTIONS.SET_INPUT_VALUE:
      return {
        ...state,
        inputValue: action.payload,
      };

    case CHAT_ACTIONS.SET_CONVERSATION_ID:
      return {
        ...state,
        activeConversationId: action.payload,
      };

    case CHAT_ACTIONS.SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload,
      };

    case CHAT_ACTIONS.ADD_CONVERSATION:
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case CHAT_ACTIONS.SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversationId: action.payload,
        messages: [], // Clear messages when switching conversations
      };

    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case CHAT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// API base URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Chat Context Provider
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Memoize the loadConversations function
  const loadConversations = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/conversations/${state.userId}`
      );
      dispatch({
        type: CHAT_ACTIONS.SET_CONVERSATIONS,
        payload: response.data.conversations,
      });
    } catch (error) {
      console.error("Error loading conversations:", error);
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: "Failed to load conversations",
      });
    }
  }, [state.userId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadConversationHistory = async (conversationId) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      const response = await axios.get(
        `${API_BASE_URL}/chat/history/${conversationId}`
      );
      dispatch({
        type: CHAT_ACTIONS.SET_MESSAGES,
        payload: response.data.messages,
      });
      dispatch({
        type: CHAT_ACTIONS.SET_ACTIVE_CONVERSATION,
        payload: conversationId,
      });
    } catch (error) {
      console.error("Error loading conversation history:", error);
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: "Failed to load conversation history",
      });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to state immediately
    const userMessage = {
      sender: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: userMessage });
    dispatch({ type: CHAT_ACTIONS.SET_INPUT_VALUE, payload: "" });
    dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message,
        conversation_id: state.activeConversationId,
        user_id: state.userId,
      });

      // Add AI response to state
      const aiMessage = {
        sender: "ai",
        content: response.data.response,
        timestamp: new Date().toISOString(),
        metadata: response.data.metadata,
      };
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: aiMessage });

      // Update conversation ID if it's a new conversation
      if (!state.activeConversationId && response.data.conversation_id) {
        dispatch({
          type: CHAT_ACTIONS.SET_CONVERSATION_ID,
          payload: response.data.conversation_id,
        });
        // Reload conversations to get the new one
        loadConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        sender: "ai",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: errorMessage });
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: "Failed to send message",
      });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const startNewConversation = () => {
    dispatch({ type: CHAT_ACTIONS.SET_ACTIVE_CONVERSATION, payload: null });
    dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: [] });
  };

  const setInputValue = (value) => {
    dispatch({ type: CHAT_ACTIONS.SET_INPUT_VALUE, payload: value });
  };

  const clearError = () => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    // State
    messages: state.messages,
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    inputValue: state.inputValue,
    isLoading: state.isLoading,
    error: state.error,
    userId: state.userId,

    // Actions
    sendMessage,
    loadConversations,
    loadConversationHistory,
    startNewConversation,
    setInputValue,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
export default ChatContext;
