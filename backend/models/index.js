const mongoose = require("mongoose");

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    order_id: { type: Number, required: true, unique: true },
    user_id: { type: Number, required: true },
    status: { type: String, required: true },
    gender: { type: String, required: true },
    created_at: { type: Date, required: true },
    returned_at: { type: Date, default: null },
    shipped_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    num_of_item: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Product Schema
const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    cost: { type: Number, required: true },
    category: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    retail_price: { type: Number, required: true },
    department: { type: String, required: true },
    sku: { type: String, required: true },
    distribution_center_id: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  conversation_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true }, // Can be session-based for anonymous users
  title: { type: String, default: "New Conversation" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Message Schema
const messageSchema = new mongoose.Schema({
  conversation_id: { type: String, required: true },
  message_id: { type: String, required: true, unique: true },
  sender: { type: String, enum: ["user", "ai"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    query_type: String,
    entities_extracted: [String],
    response_time: Number,
  },
});

// Create indexes for better performance
orderSchema.index({ user_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ created_at: -1 });

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ name: "text" });

conversationSchema.index({ user_id: 1 });
conversationSchema.index({ created_at: -1 });

messageSchema.index({ conversation_id: 1, timestamp: 1 });

const Order = mongoose.model("Order", orderSchema);
const Product = mongoose.model("Product", productSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = {
  Order,
  Product,
  Conversation,
  Message,
};
