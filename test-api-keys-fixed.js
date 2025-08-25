const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function testAPI(apiName, testFunction) {
  console.log(`\n🧪 Testing: ${apiName}`);
  try {
    const result = await testFunction();
    console.log(`✅ PASS: ${apiName}`);
    console.log(`   ${result}`);
  } catch (error) {
    console.log(`❌ FAIL: ${apiName}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function testSAMGovAPI() {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    throw new Error("SAM_GOV_API_KEY not found in environment variables");
  }

  const response = await fetch(
    "https://api.sam.gov/opportunities/v2/search?limit=1",
    {
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return `Found ${data.totalRecords || 0} opportunities. API key is valid.`;
}

async function testAnthropicAPI() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not found in environment variables");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return `API key is valid. Model responded successfully.`;
}

async function testOpenAIAPI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not found in environment variables");
  }

  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return `API key is valid. Found ${data.data?.length || 0} available models.`;
}

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not found in environment variables");
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return `API key is valid. Model responded successfully.`;
}

async function testCollegeScorecardAPI() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) {
    throw new Error(
      "COLLEGE_SCORECARD_API_KEY not found in environment variables"
    );
  }

  // Remove the limit parameter as it's not supported
  const response = await fetch(
    `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&fields=id,school.name`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return `API key is valid. Found ${data.results?.length || 0} schools.`;
}

async function testSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL or key not found in environment variables");
  }

  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return `Supabase connection is working. URL: ${url}`;
}

async function main() {
  console.log("🔑 GovContractAI - API Key Verification (Fixed)");
  console.log("==============================================\n");

  await testAPI("SAM.gov API", testSAMGovAPI);
  await testAPI("Anthropic API", testAnthropicAPI);
  await testAPI("OpenAI API", testOpenAIAPI);
  await testAPI("Perplexity API", testPerplexityAPI);
  await testAPI("College Scorecard API", testCollegeScorecardAPI);
  await testAPI("Supabase Connection", testSupabaseConnection);

  console.log("\n📊 API Key Status Summary");
  console.log("========================");
  console.log("✅ Working APIs: Check the results above");
  console.log("❌ Failed APIs: Check the error messages above");
  console.log("\n💡 If any API failed, you may need to:");
  console.log("   • Renew expired API keys");
  console.log("   • Check API key permissions");
  console.log("   • Verify billing/credits for paid APIs");
  console.log("   • Update environment variables");
}

main().catch(console.error);
