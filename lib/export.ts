import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportCSV(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const head = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${name}.csv`;
  a.click();
}

export function exportPDF(title: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const doc = new jsPDF();
  doc.setFontSize(14).text(title, 14, 16);
  const head = Object.keys(rows[0]);
  autoTable(doc, { startY: 22, head: [head], body: rows.map((r) => head.map((h) => String(r[h] ?? ""))), headStyles: { fillColor: [30, 41, 59] } });
  doc.save(`${title}.pdf`);
}
