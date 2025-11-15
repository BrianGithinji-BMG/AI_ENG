import OpenAI from "openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // We ONLY allow POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

      // Get JSON body
      const { stockData } = await request.json();

      if (!stockData || stockData.length === 0) {
        return new Response(
          JSON.stringify({ error: "No stock data provided" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Build summary for prompt
      const summary = stockData
        .map((s) =>
          s.error
            ? `${s.ticker}: ${s.error}`
            : `${s.ticker}: Open $${s.open}, Close $${s.close}, Change $${s.change} (${s.percentChange}%)`
        )
        .join("\n");

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional financial analyst. Give concise insights and a recommendation.",
          },
          {
            role: "user",
            content: `Analyze the following stock data and give a short report:\n\n${summary}`,
          },
        ],
      });

      return new Response(
        JSON.stringify({
          report: completion.choices[0].message.content,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      console.error("Worker error:", err);
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
