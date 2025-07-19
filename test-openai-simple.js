const OpenAI = require("openai");
require("dotenv").config({ path: ".env.local" });

async function testOpenAI() {
  console.log("🧪 Testing OpenAI API Key...");
  console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
  console.log("API Key length:", process.env.OPENAI_API_KEY?.length || 0);

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in environment variables");
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("📄 Making test API call...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: 'Say "Hello, OpenAI is working!"' },
      ],
      max_tokens: 50,
      temperature: 0.2,
    });

    console.log("✅ OpenAI API Response:", response.choices[0].message.content);
    console.log("🎉 OpenAI integration is working!");
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testOpenAI();
