import { useState } from 'react';
import { Printer, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportToExcel, exportToPdf, printReport } from '../lib/export';
import toast from 'react-hot-toast';

/**
 * Reusable export bar with Print / Excel / PDF buttons.
 *
 * Props:
 *   name        — filename base (no extension)
 *   rows        — array of objects to export
 *   columns     — [{ key, label, format?: (v, row) => string }]
 *   title       — PDF/print heading (defaults to "Mekky International — <name>")
 *   subtitle    — optional second line on PDF
 */
export default function ExportToolbar({ name, rows, columns, title, subtitle }) {
  const [pdfBusy, setPdfBusy] = useState(false);

  const handleExcel = () => {
    if (!rows?.length) return toast.error('Nothing to export');
    try { exportToExcel(name, rows, columns); }
    catch (e) { toast.error('Excel export failed: ' + e.message); }
  };
  const handlePdf = async () => {
    if (!rows?.length) return toast.error('Nothing to export');
    if (pdfBusy) return;
    setPdfBusy(true);
    const t = toast.loading('Generating PDF…');
    try {
      await exportToPdf(name, rows, columns, { title, subtitle });
      toast.success('PDF downloaded', { id: t });
    } catch (e) {
      toast.error('PDF export failed: ' + e.message, { id: t });
    } finally {
      setPdfBusy(false);
    }
  };
  const handlePrint = () => {
    if (!rows?.length) return toast.error('Nothing to print');
    printReport(name, rows, columns, { title, subtitle });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={handlePrint} className="btn-secondary" title="Print">
        <Printer size={14}/> Print
      </button>
      <button onClick={handleExcel} className="btn-secondary" title="Export to Excel">
        <FileSpreadsheet size={14}/> Excel
      </button>
      <button onClick={handlePdf} disabled={pdfBusy} className="btn-secondary" title="Download PDF">
        {pdfBusy ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>}
        {pdfBusy ? 'Generating…' : 'PDF'}
      </button>
    </div>
  );
}
