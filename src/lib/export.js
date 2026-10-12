/**
 * Export helpers — Excel (.xlsx), PDF & Print.
 *
 * Strategy:
 *   - Excel: SheetJS (xlsx) — bulletproof Arabic support
 *   - Print:  open a clean HTML window with only the report → window.print()
 *             (sidebar/topbar never appear, fonts preserved including Arabic)
 *   - PDF:    SAME clean HTML window → user picks "Save as PDF" in the print dialog.
 *             This sidesteps jsPDF's lack of Arabic font glyphs entirely.
 */
import * as XLSX from 'xlsx';

function defaultFilename(name) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${name}-${stamp}`;
}

function isArabic(s) {
  return /[؀-ۿ]/.test(String(s || ''));
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build a full standalone HTML document containing only the report.
 * The Cairo + Inter fonts are loaded from Google Fonts so Arabic text renders correctly.
 */
function buildPrintHtml({ title, subtitle, rows, columns, mode = 'print' }) {
  const headRow = columns.map(c => `<th class="${isArabic(c.label) ? 'rtl' : ''}">${escapeHtml(c.label)}</th>`).join('');
  const bodyRows = rows.map(r => {
    const cells = columns.map(c => {
      const raw = r[c.key];
      const display = c.format ? c.format(raw, r) : (raw == null ? '' : raw);
      const isAr = isArabic(display);
      return `<td class="${isAr ? 'rtl' : ''}">${escapeHtml(display)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const printHeader = mode === 'pdf'
    ? `<div class="hint">Tip: in the print dialog, choose <strong>"Save as PDF"</strong> to download.</div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title || 'Mekky International')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: 'Inter', 'Cairo', system-ui, sans-serif;
    color: #1a1e44; margin: 24px; background: white;
  }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #333b83; padding-bottom: 12px; margin-bottom: 16px; }
  .header img { height: 56px; }
  .header h1 { margin: 0; font-size: 18px; color: #333b83; font-weight: 700; }
  .header .meta { font-size: 11px; color: #666; text-align: right; }
  .hint { background: #eef0fb; color: #333b83; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 12px; }
  .hint strong { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th {
    background: #333b83; color: white; text-align: left; padding: 8px 6px;
    font-weight: 600; border: 1px solid #2b3270;
  }
  thead th.rtl { text-align: right; font-family: 'Cairo', sans-serif; }
  tbody td { padding: 6px; border: 1px solid #e5e7eb; font-size: 11px; vertical-align: top; word-break: break-word; }
  tbody td.rtl { direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; }
  tbody tr:nth-child(even) td { background: #f6f7fb; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
  .print-bar {
    position: sticky; top: 0; z-index: 10;
    background: #333b83; color: white; padding: 10px 16px;
    display: flex; gap: 8px; align-items: center; justify-content: space-between;
    margin: -24px -24px 16px;
  }
  .print-bar button { background: white; color: #333b83; border: 0; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-weight: 600; font-size: 12px; }
  .print-bar button:hover { background: #eef0fb; }
  @media print {
    .print-bar { display: none; }
    body { margin: 0; padding: 16px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    @page { margin: 14mm; size: A4 ${columns.length > 6 ? 'landscape' : 'portrait'}; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <span style="font-size:13px;">${escapeHtml(title || 'Report')} — ${rows.length} row(s)</span>
    <span>
      <button onclick="window.print()">${mode === 'pdf' ? 'Save as PDF' : 'Print'}</button>
      <button onclick="window.close()" style="background:#999;color:white;">Close</button>
    </span>
  </div>
  ${printHeader}
  <div class="header">
    <div style="display:flex;align-items:center;gap:14px;">
      <img src="/mekky-logo.svg" alt="MEKKY" onerror="this.style.display='none'">
      <div>
        <h1>${escapeHtml(title || 'Mekky International')}</h1>
        ${subtitle ? `<div style="font-size:11px;color:#666;margin-top:2px;">${escapeHtml(subtitle)}</div>` : ''}
      </div>
    </div>
    <div class="meta">
      Generated<br><strong>${new Date().toLocaleString()}</strong>
    </div>
  </div>
  <table>
    <thead><tr>${headRow}</tr></thead>
    <tbody>${bodyRows || `<tr><td colspan="${columns.length}" style="text-align:center;padding:24px;color:#999;">No data</td></tr>`}</tbody>
  </table>
  <div class="footer">
    <span>Mekky International General Trading &amp; Contracting Co. — Kuwait</span>
    <span>Generated by Mekky ERP</span>
  </div>
</body>
</html>`;
}

function openPrintWindow(html, autoPrint = false) {
  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print or export to PDF.');
    return null;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  if (autoPrint) {
    // wait for fonts + images
    win.onload = () => setTimeout(() => win.print(), 400);
  }
  return win;
}

export function exportToExcel(name, rows, columns) {
  const headerRow = columns.map(c => c.label);
  const data = rows.map(r => columns.map(c => {
    const v = r[c.key];
    return c.format ? c.format(v, r) : (v == null ? '' : v);
  }));
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...data]);
  const widths = columns.map((c, i) => ({
    wch: Math.min(50, Math.max(c.label.length + 2,
      ...data.map(row => String(row[i] ?? '').length + 2)
    )),
  }));
  ws['!cols'] = widths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  XLSX.writeFile(wb, `${defaultFilename(name)}.xlsx`);
}

/**
 * Direct PDF download — uses html2pdf.js to render the same Arabic-aware HTML
 * to canvas, then to PDF, and triggers a browser download.
 * No popup, no print dialog.
 */
export async function exportToPdf(name, rows, columns, opts = {}) {
  // Dynamic import keeps html2pdf out of the main bundle until needed
  const { default: html2pdf } = await import('html2pdf.js');

  // Build HTML without the .print-bar (we don't need the in-window controls)
  const html = buildPrintHtml({
    title: opts.title || name,
    subtitle: opts.subtitle,
    rows, columns,
    mode: 'pdf',
  })
    .replace(/<div class="print-bar">[\s\S]*?<\/div>/, '')
    .replace(/<div class="hint">[\s\S]*?<\/div>/, '');

  // Render into a detached div positioned off-screen
  const container = document.createElement('div');
  container.innerHTML = html;
  // The buildPrintHtml returns a full HTML document; pull just the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/);
  const headStyles = headMatch ? headMatch[1].match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] || '' : '';

  // Inject Cairo + Inter fonts (in case they're not yet loaded in the parent doc)
  if (!document.getElementById('mekky-pdf-fonts')) {
    const link = document.createElement('link');
    link.id = 'mekky-pdf-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-99999px;top:0;width:1200px;background:white;';
  wrapper.innerHTML = `<style>${headStyles}</style>${bodyContent}`;
  document.body.appendChild(wrapper);

  // Wait for fonts to load before rendering — critical for Arabic
  try { await document.fonts.ready; } catch {}

  const orientation = columns.length > 6 ? 'landscape' : 'portrait';
  const filename = `${defaultFilename(name)}.pdf`;

  try {
    await html2pdf()
      .set({
        margin:       [10, 8, 10, 8],
        filename,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}

export function printReport(name, rows, columns, opts = {}) {
  const html = buildPrintHtml({
    title: opts.title || name,
    subtitle: opts.subtitle,
    rows, columns,
    mode: 'print',
  });
  openPrintWindow(html, true);
}

// Backwards-compatible alias for the legacy printSection() call
export function printSection() {
  window.print();
}
