const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const { stockData } = await request.json();

      if (!stockData) {
        return new Response(
          JSON.stringify({ error: "Missing stockData in request body" }),
          { headers: corsHeaders, status: 400 }
        );
      }

      const prompt = `
Given stock data for the past trading day:
${JSON.stringify(stockData, null, 2)}

Write a short report (≤150 words) describing each stock's performance and recommending buy, hold, or sell. Keep a friendly, conversational tone.
`;

      // Using Gemini 2.0 Flash Lite - should be available
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Gemini API error:", result);
        return new Response(
          JSON.stringify({ 
            error: result.error?.message || `API error: ${response.status}`
          }),
          { headers: corsHeaders, status: 500 }
        );
      }

      const report = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated";

      return new Response(
        JSON.stringify({ report }), 
        { headers: corsHeaders }
      );

    } catch (err) {
      console.error("Worker error:", err);
      return new Response(
        JSON.stringify({ error: err.message }),
        { headers: corsHeaders, status: 500 }
      );
    }
  }
};