import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ Get API key from Vite environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ Log and check key
console.log("✅ Gemini API Key loaded:", apiKey ? "YES" : "NO");
console.log("🔑 Key preview:", apiKey ? apiKey.slice(0, 8) + "..." : "❌ Missing");

// ✅ If missing key, show alert and stop app
if (!apiKey) {
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
      ⚠️ Missing API key! <br>
      Please create a <code>.env</code> file in your project root and add:<br><br>
      <code>VITE_GEMINI_API_KEY=your_api_key_here</code><br><br>
      Then restart your dev server (<b>npm run dev</b>).
    </div>
  `;
  throw new Error("Missing Gemini API key");
}

// ✅ Initialize Gemini model
const genAI = new GoogleGenerativeAI({ apiKey });
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ✅ Elements
const form = document.getElementById("ticker-input-form");
const tickerInput = document.getElementById("ticker-input");
const tickerDisplay = document.querySelector(".ticker-choice-display");
const generateReportBtn = document.querySelector(".generate-report-btn");
const loadingPanel = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");
const outputPanel = document.querySelector(".output-panel");
const actionPanel = document.querySelector(".action-panel");

let tickersArr = [];

// ✅ Add ticker to list
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = tickerInput.value.trim().toUpperCase();

  // Validate input
  if (value.length < 2) {
    const label = document.getElementsByTagName("label")[0];
    label.style.color = "red";
    label.textContent =
      "You must add at least one ticker (3+ letters, e.g. TSLA).";
    return;
  }

  // Add new ticker
  if (!tickersArr.includes(value)) {
    tickersArr.push(value);
    renderTickers();
  }

  // Reset input
  tickerInput.value = "";
  generateReportBtn.disabled = false;
});

// ✅ Render tickers visually
function renderTickers() {
  tickerDisplay.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const span = document.createElement("span");
    span.textContent = ticker;
    span.classList.add("ticker");
    tickerDisplay.appendChild(span);
  });
}

// ✅ Handle "Generate Report" button
generateReportBtn.addEventListener("click", async () => {
  if (!tickersArr.length) return;

  actionPanel.style.display = "none";
  loadingPanel.style.display = "flex";
  apiMessage.innerText = "Fetching stock data...";

  try {
    // Temporary fake stock data
    const fakeStockData = tickersArr.map((ticker) => ({
      ticker,
      price: (Math.random() * 200 + 50).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
    }));

    apiMessage.innerText = "Analyzing stock trends...";
    await fetchReport(fakeStockData);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    loadingPanel.innerText = "There was an error fetching stock data.";
  }
});

// ✅ Send prompt to Gemini model
async function fetchReport(stockData) {
  try {
    const prompt = `
      You are a friendly financial analyst. Based on the following mock stock data,
      give a brief insight on whether to BUY, HOLD, or SELL each stock:
      ${JSON.stringify(stockData, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    renderReport(output);
  } catch (error) {
    console.error("Error generating AI report:", error);
    loadingPanel.innerText =
      "Error generating AI report. Please check your API key or try again later.";
  }
}

// ✅ Display AI response
function renderReport(output) {
  loadingPanel.style.display = "none";
  outputPanel.style.display = "block";
  outputPanel.innerHTML = `<p>${output}</p>`;
}
