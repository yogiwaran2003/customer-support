const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const { Order, Product } = require("../models");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Function to parse date strings
const parseDate = (dateString) => {
  if (!dateString || dateString.trim() === "") return null;
  return new Date(dateString);
};

// Function to load orders from CSV
const loadOrders = () => {
  return new Promise((resolve, reject) => {
    const orders = [];
    const ordersPath = path.join(__dirname, "../../data/orders.csv");

    fs.createReadStream(ordersPath)
      .pipe(csv())
      .on("data", (row) => {
        const orderData = {
          order_id: parseInt(row.order_id),
          user_id: parseInt(row.user_id),
          status: row.status,
          gender: row.gender,
          created_at: parseDate(row.created_at),
          returned_at: parseDate(row.returned_at),
          shipped_at: parseDate(row.shipped_at),
          delivered_at: parseDate(row.delivered_at),
          num_of_item: parseInt(row.num_of_item),
        };
        orders.push(orderData);
      })
      .on("end", () => {
        console.log(`Parsed ${orders.length} orders from CSV`);
        resolve(orders);
      })
      .on("error", reject);
  });
};

// Function to load products from CSV
const loadProducts = () => {
  return new Promise((resolve, reject) => {
    const products = [];
    const productsPath = path.join(__dirname, "../../data/products.csv");

    fs.createReadStream(productsPath)
      .pipe(csv())
      .on("data", (row) => {
        const productData = {
          id: parseInt(row.id),
          cost: parseFloat(row.cost),
          category: row.category,
          name: row.name,
          brand: row.brand,
          retail_price: parseFloat(row.retail_price),
          department: row.department,
          sku: row.sku,
          distribution_center_id: parseInt(row.distribution_center_id),
        };
        products.push(productData);
      })
      .on("end", () => {
        console.log(`Parsed ${products.length} products from CSV`);
        resolve(products);
      })
      .on("error", reject);
  });
};

// Main function to load all data
const loadAllData = async () => {
  try {
    console.log("Starting data loading process...");

    // Clear existing data
    console.log("Clearing existing data...");
    await Order.deleteMany({});
    await Product.deleteMany({});

    // Load orders
    console.log("Loading orders...");
    const orders = await loadOrders();
    await Order.insertMany(orders, { ordered: false });
    console.log(`✓ Inserted ${orders.length} orders`);

    // Load products
    console.log("Loading products...");
    const products = await loadProducts();
    await Product.insertMany(products, { ordered: false });
    console.log(`✓ Inserted ${products.length} products`);

    console.log("Data loading completed successfully!");

    // Display some statistics
    const orderCount = await Order.countDocuments();
    const productCount = await Product.countDocuments();
    const uniqueUsers = await Order.distinct("user_id");
    const orderStatuses = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    console.log("\n=== Database Statistics ===");
    console.log(`Total Orders: ${orderCount}`);
    console.log(`Total Products: ${productCount}`);
    console.log(`Unique Users: ${uniqueUsers.length}`);
    console.log("Order Status Distribution:");
    orderStatuses.forEach((status) => {
      console.log(`  ${status._id}: ${status.count}`);
    });
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the data loading
if (require.main === module) {
  loadAllData();
}

module.exports = { loadAllData };
