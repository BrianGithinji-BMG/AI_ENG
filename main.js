import { GoogleGenerativeAI } from "@google/generative-ai";

const tickersArr = [];
const generateReportBtn = document.querySelector(".generate-report-btn");
const loadingArea = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");

// Load Gemini model
const genAI = new GoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Handle ticker input
document.getElementById("ticker-input-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const tickerInput = document.getElementById("ticker-input");
  if (tickerInput.value.length > 2) {
    generateReportBtn.disabled = false;
    tickersArr.push(tickerInput.value.toUpperCase());
    tickerInput.value = "";
    renderTickers();
  }
});

function renderTickers() {
  const tickersDiv = document.querySelector(".ticker-choice-display");
  tickersDiv.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const newTickerSpan = document.createElement("span");
    newTickerSpan.textContent = ticker;
    newTickerSpan.classList.add("ticker");
    tickersDiv.appendChild(newTickerSpan);
  });
}

// Simulate stock data fetching
async function fetchStockData() {
  document.querySelector(".action-panel")?.style?.display = "none";
  loadingArea.style.display = "flex";
  apiMessage.innerText = "Analyzing stock trends...";

  const fakeStockData = tickersArr.map((ticker) => ({
    ticker,
    price: (Math.random() * 200 + 50).toFixed(2),
    change: (Math.random() * 10 - 5).toFixed(2),
  }));

  await fetchReport(fakeStockData);
}

generateReportBtn.addEventListener("click", fetchStockData);

// Generate report using Gemini
async function fetchReport(stockData) {
  try {
    const prompt = `
      You are a financial analyst. Based on the following mock stock data,
      give a brief insight on whether to buy, hold, or sell each stock:

      ${JSON.stringify(stockData, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const output = result.response.text();

    renderReport(output);
  } catch (error) {
    console.error("Error generating report:", error);
    apiMessage.innerText = "Error generating report.";
  }
}

function renderReport(output) {
  loadingArea.style.display = "none";
  const outputArea = document.querySelector(".output-panel");
  outputArea.innerHTML = `<p>${output}</p>`;
  outputArea.style.display = "block";
}
