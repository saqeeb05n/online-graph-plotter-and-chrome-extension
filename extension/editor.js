/* ==============================
   GLOBALS
============================== */

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 5;

let chart = null;

const table = document.getElementById("dataTable");
const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generate");
const downloadBtn = document.getElementById("download");
const chartCanvas = document.getElementById("chart");

const xSelect = document.getElementById("xCol");
const ySelect = document.getElementById("yCol");
const chartTypeSelect = document.getElementById("chartType");

const API_URL = "http://localhost:5000/parse"; // change to Render later

/* ==============================
   INITIAL TABLE
============================== */

function createEmptyTable(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
  table.innerHTML = "";

  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  for (let c = 0; c < cols; c++) {
    const th = document.createElement("th");
    th.textContent = `Col ${c + 1}`;
    th.contentEditable = true;
    headerRow.appendChild(th);
  }

  const tbody = table.createTBody();
  for (let r = 0; r < rows; r++) {
    const tr = tbody.insertRow();
    for (let c = 0; c < cols; c++) {
      const td = tr.insertCell();
      td.contentEditable = true;
    }
  }

  populateSelectorsFromTable();
}

createEmptyTable();

/* ==============================
   PASTE HANDLING (EXCEL-LIKE)
============================== */

table.addEventListener("paste", e => {
  e.preventDefault();

  const text = e.clipboardData.getData("text");
  if (!text) return;

  const rows = text
    .trim()
    .split("\n")
    .map(r => r.split("\t"));

  loadData(rows);
});

/* ==============================
   FILE UPLOAD (CSV / XLSX)
============================== */

fileInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    const rows = [
      data.columns,
      ...data.rows.slice(0, 10).map(r =>
        data.columns.map(col => r[col])
      )
    ];

    loadData(rows);
  } catch (err) {
    alert("Failed to parse file");
    console.error(err);
  }
});

/* ==============================
   LOAD DATA INTO TABLE
============================== */

function loadData(rows) {
  table.innerHTML = "";

  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  rows[0].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col || "";
    th.contentEditable = true;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();
  rows.slice(1).forEach(r => {
    const tr = tbody.insertRow();
    r.forEach(cell => {
      const td = tr.insertCell();
      td.textContent = cell;
      td.contentEditable = true;
    });
  });

  populateSelectorsFromTable();
}

/* ==============================
   READ DATA FROM TABLE
============================== */

function readTableData() {
  const headers = [...document.querySelectorAll("thead th")]
    .map(th => th.textContent.trim())
    .filter(h => h !== "");

  const rows = [];

  document.querySelectorAll("tbody tr").forEach(tr => {
    const row = [...tr.querySelectorAll("td")].map(td => td.textContent.trim());
    if (row.some(cell => cell !== "")) {
      rows.push(row);
    }
  });

  return { headers, rows };
}

/* ==============================
   DROPDOWNS
============================== */

function populateSelectorsFromTable() {
  xSelect.innerHTML = "";
  ySelect.innerHTML = "";

  document.querySelectorAll("thead th").forEach(th => {
    const col = th.textContent.trim();
    if (col) {
      xSelect.add(new Option(col, col));
      ySelect.add(new Option(col, col));
    }
  });
}

table.addEventListener("input", e => {
  if (e.target.tagName === "TH") {
    populateSelectorsFromTable();
  }
});

/* ==============================
   GENERATE GRAPH
============================== */

generateBtn.onclick = () => {
  const { headers, rows } = readTableData();

  if (!rows.length) {
    alert("No data to plot");
    return;
  }

  const xCol = xSelect.value;
  const yCol = ySelect.value;
  const type = chartTypeSelect.value;

  const xIdx = headers.indexOf(xCol);
  const yIdx = headers.indexOf(yCol);

  if (xIdx === -1 || yIdx === -1) {
    alert("Invalid column selection");
    return;
  }

  if (chart) chart.destroy();

  if (type === "scatter") {
    chart = new Chart(chartCanvas, {
      type: "scatter",
      data: {
        datasets: [{
          label: `${yCol} vs ${xCol}`,
          data: rows.map(r => ({
            x: Number(r[xIdx]),
            y: Number(r[yIdx])
          }))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false
      }
    });
  } else {
    chart = new Chart(chartCanvas, {
      type,
      data: {
        labels: rows.map(r => r[xIdx]),
        datasets: [{
          label: yCol,
          data: rows.map(r => Number(r[yIdx]))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false
      }
    });
  }

  downloadBtn.style.display = "block";
};

/* ==============================
   DOWNLOAD IMAGE
============================== */

downloadBtn.onclick = () => {
  if (!chart) return;

  const link = document.createElement("a");
  link.download = "graph.png";
  link.href = chart.toBase64Image("image/png", 1);
  link.click();
};
