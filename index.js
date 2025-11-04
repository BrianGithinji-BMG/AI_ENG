// ✅ Load API Keys
const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
const polygonKey = import.meta.env.VITE_POLYGON_API_KEY;

console.log("✅ OpenAI Key loaded:", openaiKey ? "YES" : "NO");
console.log("✅ Polygon Key loaded:", polygonKey ? "YES" : "NO");

// ✅ Key check
if (!openaiKey || !polygonKey) {
  document.body.innerHTML = `
    <div style="
      background: #ff4b4b;
      color: white;
      font-weight: bold;
      padding: 20px;
      text-align: center;
      border-radius: 12px;
      margin: 30px;
      font-size: 18px;
    ">
      ⚠️ Missing API key(s)!<br>
      Please ensure your .env file includes:<br><br>
      <code>VITE_OPENAI_API_KEY=your_openai_key</code><br>
      <code>VITE_POLYGON_API_KEY=your_polygon_key</code><br><br>
      Then restart with <b>npm run dev</b>.
    </div>
  `;
  throw new Error("Missing one or more API keys.");
}

// ✅ Select DOM elements
const form = document.getElementById("ticker-input-form");
const tickerInput = document.getElementById("ticker-input");
const tickerDisplay = document.querySelector(".ticker-choice-display");
const generateReportBtn = document.querySelector(".generate-report-btn");
const loadingPanel = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");
const outputPanel = document.querySelector(".output-panel");
const actionPanel = document.querySelector(".action-panel");

let tickersArr = [];

// ✅ Add stock ticker
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = tickerInput.value.trim().toUpperCase();

  if (value.length < 2) {
    const label = document.getElementsByTagName("label")[0];
    label.style.color = "red";
    label.textContent = "Enter a valid stock ticker (e.g. TSLA)";
    return;
  }

  if (!tickersArr.includes(value)) {
    tickersArr.push(value);
    renderTickers();
  }

  tickerInput.value = "";
  generateReportBtn.disabled = false;
});

// ✅ Render tickers
function renderTickers() {
  tickerDisplay.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const span = document.createElement("span");
    span.textContent = ticker;
    span.classList.add("ticker");
    tickerDisplay.appendChild(span);
  });
}

// ✅ Generate report
generateReportBtn.addEventListener("click", async () => {
  if (!tickersArr.length) return;

  actionPanel.style.display = "none";
  loadingPanel.style.display = "flex";
  apiMessage.innerText = "Fetching real stock data...";

  try {
    const stockData = await getRealStockData(tickersArr);
    apiMessage.innerText = "Analyzing stock trends...";
    await fetchReport(stockData);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    loadingPanel.innerText = "Error fetching stock data. Try again later.";
  }
});

// ✅ Get Real Stock Data (Polygon.io)
async function getRealStockData(tickers) {
  const results = [];

  for (const ticker of tickers) {
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${polygonKey}`
      );

      if (!response.ok) throw new Error(`Polygon error: ${response.statusText}`);

      const data = await response.json();
      const stock = data.results?.[0];

      if (stock) {
        const open = stock.o;
        const close = stock.c;
        const change = (close - open).toFixed(2);
        const percentChange = ((change / open) * 100).toFixed(2);

        results.push({
          ticker,
          open,
          close,
          change,
          percentChange,
        });
      } else {
        results.push({
          ticker,
          error: "No data available",
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch ${ticker}:`, error);
      results.push({
        ticker,
        error: "Fetch failed",
      });
    }
  }

  return results;
}

// ✅ Fetch AI report using OpenAI API
async function fetchReport(stockData) {
  try {
    const prompt = `
      You are a financial analyst. Based on the real stock data below, 
      provide a short analysis for each stock and conclude with a clear 
      recommendation (BUY, HOLD, or SELL).

      ${JSON.stringify(stockData, null, 2)}
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert stock analyst providing clear, concise insights for investors.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.statusText}`);

    const data = await response.json();
    const output =
      data.choices?.[0]?.message?.content?.trim() ||
      "No response generated by AI.";

    renderReport(output);
  } catch (error) {
    console.error("Error generating AI report:", error);
    loadingPanel.innerText =
      "Error generating AI report. Please check your OpenAI key or try again later.";
  }
}

// ✅ Render AI output
function renderReport(output) {
  loadingPanel.style.display = "none";
  outputPanel.style.display = "block";
  outputPanel.innerHTML = `<p>${output}</p>`;
}
