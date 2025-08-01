const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatControllers");

// POST /api/chat - Main chat endpoint
router.post("/", chatController.handleChat.bind(chatController));

// GET /api/chat/conversations/:user_id - Get user's conversations
router.get(
  "/conversations/:user_id",
  chatController.getUserConversations.bind(chatController)
);

// GET /api/chat/history/:conversation_id - Get conversation history
router.get(
  "/history/:conversation_id",
  chatController.getConversationHistory.bind(chatController)
);

module.exports = router;
