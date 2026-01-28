let chart;
const table = document.getElementById("dataTable");

function createEmptyTable(rows = 10, cols = 5) {
  table.innerHTML = "";

  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  for (let c = 0; c < cols; c++) {
    const th = document.createElement("th");
    th.textContent = `Col ${c + 1}`;
    th.contentEditable = true;   // 👈 KEY
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

document.getElementById("fileInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:5000/parse", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  const rows = [
    data.columns,
    ...data.rows.slice(0, 10).map(r =>
      data.columns.map(c => r[c])
    )
  ];

  loadData(rows);
});

function loadData(rows) {
  table.innerHTML = "";

  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  rows[0].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col || "";
    th.contentEditable = true;   // 👈 still editable
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


function populateSelectors(cols) {
  const x = document.getElementById("xCol");
  const y = document.getElementById("yCol");
  x.innerHTML = y.innerHTML = "";
  cols.forEach(c => {
    x.add(new Option(c, c));
    y.add(new Option(c, c));
  });
}

function readTableData() {
  const headers = [...document.querySelectorAll("thead th")]
    .map(th => th.textContent.trim())
    .filter(h => h !== "");

  const rows = [];

  document.querySelectorAll("tbody tr").forEach(tr => {
    const row = [...tr.querySelectorAll("td")].map(td => td.textContent.trim());
    if (row.some(v => v !== "")) rows.push(row);
  });

  return { headers, rows };
}


document.getElementById("generate").onclick = () => {
  const { headers, rows } = readTableData();

  if (!rows.length) {
    alert("No data to plot");
    return;
  }

  const xSelect = document.getElementById("xCol");
  const ySelect = document.getElementById("yCol");
  const chartTypeSelect = document.getElementById("chartType");

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
    chart = new Chart(document.getElementById("chart"), {
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
        maintainAspectRatio: true,   // 👈 REQUIRED
        animation: false
      }
    });
  } else {
    chart = new Chart(document.getElementById("chart"), {
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
        maintainAspectRatio: true,   // 👈 REQUIRED
        animation: false
      }
    });
  }

  document.getElementById("download").style.display = "block";
};


function chartCanvas() {
  return document.getElementById("chart");
}

document.getElementById("download").onclick = () => {
  const link = document.createElement("a");
  link.download = "graph.png";
  link.href = chart.toBase64Image("image/png", 1);
  link.click();
};


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

function populateSelectorsFromTable() {
  const x = document.getElementById("xCol");
  const y = document.getElementById("yCol");

  x.innerHTML = "";
  y.innerHTML = "";

  document.querySelectorAll("thead th").forEach(th => {
    const col = th.textContent.trim();
    if (col) {
      x.add(new Option(col, col));
      y.add(new Option(col, col));
    }
  });
}

table.addEventListener("input", e => {
  if (e.target.tagName === "TH") {
    populateSelectorsFromTable();
  }
});
