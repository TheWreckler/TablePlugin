import { createRequire } from 'module';

createRequire(import.meta.url);

// src/transformer.ts
var sheetTableScript = `
document.addEventListener("nav", () => {
  document.querySelectorAll("figure pre code").forEach(codeEl => {
    const text = codeEl.textContent.trim();
    if (!(text.startsWith("|") && text.includes("|<|"))) return;

    const figure = codeEl.closest("figure");
    if (!figure || figure.dataset.tableFixed) return;
    figure.dataset.tableFixed = "true";

    const rawLines = text.split("\\n").map(l => l.trim()).filter(l => l.length > 0);

    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    rawLines.forEach(line => {
      const rawCells = line.replace(/^\\|/, "").replace(/\\|$/, "").split("|");
      const row = document.createElement("tr");
      let lastCell = null;

      rawCells.forEach(rawCell => {
        let cellText = rawCell.trim();

        if (cellText === "<") {
          if (lastCell) {
            lastCell.colSpan = (lastCell.colSpan || 1) + 1;
          }
          return;
        }

        const cell = document.createElement("td");

        const attrMatch = cellText.match(/(.*?)\\s*~\\s*\\{\\s*"([^"]+)"\\s*:\\s*"([^"]+)"\\s*\\}/);
        if (attrMatch) {
          cellText = attrMatch[1].trim();
          cell.style[attrMatch[2]] = attrMatch[3];
        }

        cell.innerHTML = cellText.replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>");

        row.appendChild(cell);
        lastCell = cell;
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    const container = document.createElement("div");
    container.className = "table-container";
    container.appendChild(table);

    figure.replaceWith(container);
  });
});
`;
var SheetTables = () => {
  return {
    name: "SheetTables",
    externalResources() {
      return {
        js: [
          {
            contentType: "inline",
            loadTime: "afterDOMReady",
            script: sheetTableScript
          }
        ]
      };
    }
  };
};

export { SheetTables };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map