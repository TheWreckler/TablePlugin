import type { QuartzTransformerPlugin } from "@quartz-community/types";

/**
 * Converts Obsidian "Sheets Extended" ```sheet code blocks into real HTML
 * tables in the browser after page load. Handles:
 *  - "<" as a horizontal cell-merge marker (colspan)
 *  - trailing `~ { "css-prop": "value" }` inline style syntax
 *  - **bold** markdown within cells
 *
 * This runs client-side (via an injected inline script) rather than as a
 * build-time AST transform, since the parsing logic was already validated
 * directly against real site content before this plugin was written.
 */
const sheetTableScript = `
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

        cell.innerHTML = cellText
          .replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>")
          .replace(/_(.+?)_/g, "<em>$1</em>");

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

export const SheetTables: QuartzTransformerPlugin = () => {
  return {
    name: "SheetTables",
    markdownPlugins() {
      return [];
    },
    htmlPlugins() {
      return [];
    },
    externalResources() {
      return {
        js: [
          {
            contentType: "inline",
            loadTime: "afterDOMReady",
            script: sheetTableScript,
          },
        ],
      };
    },
  };
};
