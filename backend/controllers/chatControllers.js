const Groq = require("groq-sdk");
const { v4: uuidv4 } = require("uuid");
const { Conversation, Message, Order, Product } = require("../models");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class ChatController {
  // Create or get conversation
  async getOrCreateConversation(userId, conversationId = null) {
    if (conversationId) {
      const conversation = await Conversation.findOne({
        conversation_id: conversationId,
      });
      if (conversation) return conversation;
    }

    // Create new conversation
    const newConversation = new Conversation({
      conversation_id: uuidv4(),
      user_id: userId,
      title: "New Conversation",
    });

    await newConversation.save();
    return newConversation;
  }

  // Save message to database
  async saveMessage(conversationId, sender, content, metadata = {}) {
    const message = new Message({
      conversation_id: conversationId,
      message_id: uuidv4(),
      sender,
      content,
      metadata,
    });

    await message.save();
    return message;
  }

  // Query products based on user criteria
  async queryProducts(criteria) {
    const query = {};

    if (criteria.category) {
      query.category = new RegExp(criteria.category, "i");
    }

    if (criteria.brand) {
      query.brand = new RegExp(criteria.brand, "i");
    }

    if (criteria.department) {
      query.department = new RegExp(criteria.department, "i");
    }

    if (criteria.name) {
      query.name = new RegExp(criteria.name, "i");
    }

    if (criteria.priceRange) {
      query.retail_price = {
        $gte: criteria.priceRange.min || 0,
        $lte: criteria.priceRange.max || Infinity,
      };
    }

    const products = await Product.find(query)
      .limit(criteria.limit || 10)
      .sort({ retail_price: 1 });

    return products;
  }

  // Query orders for a specific user
  async queryOrders(userId, criteria = {}) {
    const query = { user_id: parseInt(userId) };

    if (criteria.status) {
      query.status = new RegExp(criteria.status, "i");
    }

    if (criteria.dateRange) {
      query.created_at = {
        $gte: new Date(criteria.dateRange.start),
        $lte: new Date(criteria.dateRange.end),
      };
    }

    const orders = await Order.find(query)
      .sort({ created_at: -1 })
      .limit(criteria.limit || 20);

    return orders;
  }

  // Extract entities and intent from user message using LLM
  async extractIntent(userMessage) {
    const systemPrompt = `You are an AI assistant for an e-commerce clothing website. Analyze the user's message and extract:
1. Intent (product_search, order_inquiry, general_help, complaint, return_request)
2. Entities (product categories, brands, order numbers, user preferences)
3. Required information still needed

Respond in JSON format only:
{
  "intent": "intent_type",
  "entities": {
    "category": "category_if_mentioned",
    "brand": "brand_if_mentioned",
    "department": "department_if_mentioned",
    "price_range": {"min": number, "max": number},
    "order_id": "order_id_if_mentioned",
    "user_id": "user_id_if_mentioned"
  },
  "missing_info": ["list_of_missing_required_info"],
  "confidence": 0.9
}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "llama3-8b-8192",
        temperature: 0.1,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      return JSON.parse(response);
    } catch (error) {
      console.error("Error extracting intent:", error);
      return {
        intent: "general_help",
        entities: {},
        missing_info: [],
        confidence: 0.1,
      };
    }
  }

  // Generate AI response based on context and data
  async generateResponse(userMessage, intent, entities, contextData = null) {
    let systemPrompt = `You are a helpful customer service AI for an e-commerce clothing website. 
    Be friendly, professional, and concise. Help users with product searches, order inquiries, and general questions.`;

    let contextInfo = "";

    if (contextData) {
      if (contextData.products && contextData.products.length > 0) {
        contextInfo += `\nHere are relevant products I found:\n`;
        contextData.products.forEach((product, index) => {
          contextInfo += `${index + 1}. ${product.name} by ${
            product.brand
          } - $${product.retail_price} (${product.category})\n`;
        });
      }

      if (contextData.orders && contextData.orders.length > 0) {
        contextInfo += `\nHere are your recent orders:\n`;
        contextData.orders.forEach((order, index) => {
          contextInfo += `${index + 1}. Order #${order.order_id} - Status: ${
            order.status
          }, Items: ${order.num_of_item}, Date: ${new Date(
            order.created_at
          ).toLocaleDateString()}\n`;
        });
      }
    }

    const fullPrompt = `${systemPrompt}\n\nUser Intent: ${intent}\nExtracted Info: ${JSON.stringify(
      entities
    )}\n${contextInfo}\n\nUser Message: ${userMessage}`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "system", content: fullPrompt }],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 1000,
      });

      return (
        completion.choices[0]?.message?.content ||
        "I apologize, but I encountered an error. Please try again."
      );
    } catch (error) {
      console.error("Error generating response:", error);
      return "I apologize, but I encountered an error. Please try again later.";
    }
  }

  // Main chat endpoint
  async handleChat(req, res) {
    try {
      const { message, conversation_id, user_id = "anonymous" } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const startTime = Date.now();

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        user_id,
        conversation_id
      );

      // Save user message
      await this.saveMessage(conversation.conversation_id, "user", message);

      // Extract intent and entities
      const intentData = await this.extractIntent(message);

      // Query relevant data based on intent
      let contextData = null;

      if (intentData.intent === "product_search") {
        const products = await this.queryProducts({
          category: intentData.entities.category,
          brand: intentData.entities.brand,
          department: intentData.entities.department,
          name: intentData.entities.name,
          priceRange: intentData.entities.price_range,
          limit: 5,
        });
        contextData = { products };
      } else if (
        intentData.intent === "order_inquiry" &&
        intentData.entities.user_id
      ) {
        const orders = await this.queryOrders(intentData.entities.user_id);
        contextData = { orders };
      }

      // Generate AI response
      const aiResponse = await this.generateResponse(
        message,
        intentData.intent,
        intentData.entities,
        contextData
      );

      // Save AI response
      const responseTime = Date.now() - startTime;
      await this.saveMessage(conversation.conversation_id, "ai", aiResponse, {
        query_type: intentData.intent,
        entities_extracted: Object.keys(intentData.entities),
        response_time: responseTime,
      });

      // Update conversation timestamp and title if it's the first message
      const messageCount = await Message.countDocuments({
        conversation_id: conversation.conversation_id,
      });

      if (messageCount <= 2) {
        // First user message + first AI response
        conversation.title =
          message.substring(0, 50) + (message.length > 50 ? "..." : "");
        conversation.updated_at = new Date();
        await conversation.save();
      }

      res.json({
        response: aiResponse,
        conversation_id: conversation.conversation_id,
        metadata: {
          intent: intentData.intent,
          entities: intentData.entities,
          response_time: responseTime,
        },
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get conversation history
  async getConversationHistory(req, res) {
    try {
      const { conversation_id } = req.params;

      const messages = await Message.find({ conversation_id })
        .sort({ timestamp: 1 })
        .select("sender content timestamp metadata");

      res.json({ messages });
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get user's conversations
  async getUserConversations(req, res) {
    try {
      const { user_id = "anonymous" } = req.params;

      const conversations = await Conversation.find({ user_id })
        .sort({ updated_at: -1 })
        .limit(50);

      res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new ChatController();
