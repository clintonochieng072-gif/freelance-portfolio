// test-cloudinary.js
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

console.log("🧪 Testing Cloudinary Connection...");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testConnection() {
  try {
    console.log("🔧 Configuration:");
    console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log(
      "API Key:",
      process.env.CLOUDINARY_API_KEY ? "✅ Present" : "❌ Missing"
    );
    console.log(
      "API Secret:",
      process.env.CLOUDINARY_API_SECRET ? "✅ Present" : "❌ Missing"
    );

    // Test API ping
    console.log("🔄 Testing API connection...");
    const pingResult = await cloudinary.api.ping();
    console.log("✅ Ping successful:", pingResult);

    // Test upload with a simple string
    console.log("📤 Testing upload functionality...");
    const uploadResult = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      {
        folder: "portfolio_test",
      }
    );

    console.log("✅ Upload test successful!");
    console.log("📁 File URL:", uploadResult.secure_url);
    console.log("🎯 Public ID:", uploadResult.public_id);

    // Clean up test file
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log("🧹 Test file cleaned up");

    console.log("🎉 ALL TESTS PASSED! Cloudinary is working perfectly!");
  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    console.log("💡 Check your:");
    console.log("   - Cloudinary credentials in .env file");
    console.log("   - Internet connection");
    console.log("   - Cloudinary account status");
  }
}

testConnection();
