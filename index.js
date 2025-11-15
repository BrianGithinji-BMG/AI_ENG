// Load API key
const polygonKey = import.meta.env.VITE_POLYGON_API_KEY;

console.log("Polygon Key loaded:", polygonKey ? "YES" : "NO");

// DOM elements
const form = document.getElementById("ticker-input-form");
const tickerInput = document.getElementById("ticker-input");
const tickerDisplay = document.querySelector(".ticker-choice-display");
const generateReportBtn = document.querySelector(".generate-report-btn");
const loadingPanel = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");
const outputPanel = document.querySelector(".output-panel");
const actionPanel = document.querySelector(".action-panel");

let tickersArr = [];

// Add ticker
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = tickerInput.value.trim().toUpperCase();

  if (!value) return;

  if (!tickersArr.includes(value)) {
    tickersArr.push(value);
    renderTickers();
  }

  tickerInput.value = "";
  generateReportBtn.disabled = false;
});

// Render tickers
function renderTickers() {
  tickerDisplay.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const span = document.createElement("span");
    span.textContent = ticker;
    span.classList.add("ticker");
    tickerDisplay.appendChild(span);
  });
}

// When user clicks "Generate Report"
generateReportBtn.addEventListener("click", async () => {
  if (!tickersArr.length) return;

  actionPanel.style.display = "none";
  loadingPanel.style.display = "flex";
  apiMessage.innerText = "Fetching real stock data...";

  try {
    const stockData = await getRealStockData(tickersArr);

    apiMessage.innerText = "Analyzing stock trends...";

    await fetchReport(stockData);
  } catch (err) {
    console.error(err);
    apiMessage.innerText = "Error fetching stock data.";
    loadingPanel.style.display = "none";
  }
});

// Fetch real stock data
async function getRealStockData(tickers) {
  const results = [];

  for (const ticker of tickers) {
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${polygonKey}`
      );

      if (!response.ok) throw new Error("Polygon API error");

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
        results.push({ ticker, error: "No data available" });
      }
    } catch (err) {
      results.push({ ticker, error: "Fetch failed" });
    }
  }

  return results;
}

// Call the worker with stockData
async function fetchReport(stockData) {
  const url = "https://openai-api-worker.briangithinji564.workers.dev/";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockData }),
    });

    if (!res.ok) {
      throw new Error(`Worker error ${res.status}`);
    }

    const data = await res.json();

    if (data.error) throw new Error(data.error);

    renderReport(data.report);
  } catch (err) {
    apiMessage.innerText = "AI processing failed: " + err.message;
    loadingPanel.style.display = "none";
    actionPanel.style.display = "block";
  }
}

// Display the report
function renderReport(output) {
  loadingPanel.style.display = "none";
  outputPanel.style.display = "block";
  outputPanel.innerHTML = `<p>${output}</p>`;
}
