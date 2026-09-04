import React, { useState, useRef } from 'react';
import { StoreMasterRecord, WeeklySalesRecord } from '../types';
import {
  parseStoreMasterCSV,
  parseWeeklySalesCSV,
  parseExcelWorkbook,
  parseStoreMasterExcel,
  parseWeeklySalesExcel,
  generateExcelWorkbookTemplate,
  parsePastedTableText,
} from '../utils/dataProcessor';
import {
  getStoreMasterCSVTemplate,
  getWeeklySalesCSVTemplate,
} from '../data/sampleData';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  RotateCcw,
  FileCheck,
  Layers,
  FileText,
  Sparkles,
  Clipboard,
  ShieldCheck,
} from 'lucide-react';

interface DataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (stores: StoreMasterRecord[], sales: WeeklySalesRecord[]) => void;
  onResetToSample: () => void;
  currentStoreCount: number;
  currentSalesCount: number;
}

export const DataUploadModal: React.FC<DataUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
  onResetToSample,
  currentStoreCount,
  currentSalesCount,
}) => {
  const [uploadMode, setUploadMode] = useState<'combined' | 'separate' | 'paste'>('combined');
  const [pastedText, setPastedText] = useState('');
  const [autoExtractionNotice, setAutoExtractionNotice] = useState<string | null>(null);

  const [storeMasterFile, setStoreMasterFile] = useState<{
    name: string;
    data: StoreMasterRecord[];
    errors: string[];
    sheetName?: string;
  } | null>(null);

  const [weeklySalesFile, setWeeklySalesFile] = useState<{
    name: string;
    data: WeeklySalesRecord[];
    errors: string[];
    sheetName?: string;
  } | null>(null);

  const [workbookInfo, setWorkbookInfo] = useState<{
    fileName: string;
    sheets: { name: string; type: string; rowCount: number }[];
  } | null>(null);

  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const workbookInputRef = useRef<HTMLInputElement>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateFiles = (
    stores?: StoreMasterRecord[],
    sales?: WeeklySalesRecord[]
  ) => {
    if (stores && sales && stores.length > 0 && sales.length > 0) {
      const storeIds = new Set(stores.map((s) => s.store_id.trim().toUpperCase()));
      const unmatched = sales.filter(
        (sale) => !storeIds.has(sale.store_id.trim().toUpperCase())
      );

      if (unmatched.length > 0) {
        const uniqueUnmatched = Array.from(
          new Set(unmatched.map((u) => u.store_id))
        ).slice(0, 5);
        setValidationWarning(
          `Notice: ${unmatched.length} sales rows have store IDs not present in the Store Master (e.g. ${uniqueUnmatched.join(', ')}). Only matched stores will be analyzed.`
        );
      } else {
        setValidationWarning(null);
      }
    } else {
      setValidationWarning(null);
    }
  };

  // Upload handler for all-in-one Excel Workbook (.xlsx / .xls)
  const handleWorkbookFile = async (file: File) => {
    setIsProcessing(true);
    setGeneralError(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelWorkbook(buffer);

      if (!result.success) {
        setGeneralError(
          result.errors.length > 0
            ? result.errors.join(' ')
            : 'Could not recognize Store Master or Weekly Sales sheets in the uploaded Excel file. Please review column headers.'
        );
        setIsProcessing(false);
        return;
      }

      setWorkbookInfo({
        fileName: file.name,
        sheets: result.detectedSheets.map((s) => ({
          name: s.sheetName,
          type: s.detectedType,
          rowCount: s.rowCount,
        })),
      });

      let updatedStores = storeMasterFile?.data;
      let updatedSales = weeklySalesFile?.data;

      if (result.storeMaster) {
        setStoreMasterFile({
          name: file.name,
          sheetName: result.storeMaster.sheetName,
          data: result.storeMaster.data,
          errors: result.storeMaster.errors,
        });
        updatedStores = result.storeMaster.data;
      }

      if (result.weeklySales) {
        setWeeklySalesFile({
          name: file.name,
          sheetName: result.weeklySales.sheetName,
          data: result.weeklySales.data,
          errors: result.weeklySales.errors,
        });
        updatedSales = result.weeklySales.data;
      }

      if (result.autoExtracted) {
        setAutoExtractionNotice(
          'Zero File Edits Needed: We automatically mapped your store directory and aligned complete 12-week sales history from your single file!'
        );
      } else {
        setAutoExtractionNotice(null);
      }

      validateFiles(updatedStores, updatedSales);
    } catch (err: any) {
      setGeneralError(`Failed to process Excel file: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for pasting table data from Excel clipboard
  const handlePasteTable = () => {
    if (!pastedText.trim()) {
      setGeneralError('Please paste your table rows or cells into the text area.');
      return;
    }

    setIsProcessing(true);
    setGeneralError(null);
    try {
      const res = parsePastedTableText(pastedText);
      if (res.stores.length === 0 && res.sales.length === 0) {
        setGeneralError('Could not recognize tabular data. Please ensure header columns like Store ID, Sales, or Store Name are included.');
        setIsProcessing(false);
        return;
      }

      if (res.stores.length > 0) {
        setStoreMasterFile({
          name: 'Pasted Clipboard Data',
          data: res.stores,
          errors: res.errors,
          sheetName: 'Clipboard Stores',
        });
      }

      if (res.sales.length > 0) {
        setWeeklySalesFile({
          name: 'Pasted Clipboard Data',
          data: res.sales,
          errors: res.errors,
          sheetName: 'Clipboard Sales',
        });
      }

      setAutoExtractionNotice(res.summary);
      validateFiles(res.stores, res.sales);
    } catch (err: any) {
      setGeneralError(`Failed to parse pasted text: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload handler for individual Store Master (.xlsx / .xls / .csv)
  const handleStoreMasterFile = async (file: File) => {
    setIsProcessing(true);
    setGeneralError(null);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let data: StoreMasterRecord[] = [];
      let errors: string[] = [];
      let sheetName: string | undefined;

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const res = parseStoreMasterExcel(buffer);
        data = res.data;
        errors = res.errors;
        sheetName = res.sheetName;
      } else {
        const text = await file.text();
        const res = parseStoreMasterCSV(text);
        data = res.data;
        errors = res.errors;
      }

      setStoreMasterFile({
        name: file.name,
        sheetName,
        data,
        errors,
      });

      validateFiles(data, weeklySalesFile?.data);
    } catch (err: any) {
      setGeneralError(`Failed to read Store Master file: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload handler for individual Weekly Sales (.xlsx / .xls / .csv)
  const handleWeeklySalesFile = async (file: File) => {
    setIsProcessing(true);
    setGeneralError(null);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let data: WeeklySalesRecord[] = [];
      let errors: string[] = [];
      let sheetName: string | undefined;

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const res = parseWeeklySalesExcel(buffer);
        data = res.data;
        errors = res.errors;
        sheetName = res.sheetName;
      } else {
        const text = await file.text();
        const res = parseWeeklySalesCSV(text);
        data = res.data;
        errors = res.errors;
      }

      setWeeklySalesFile({
        name: file.name,
        sheetName,
        data,
        errors,
      });

      validateFiles(storeMasterFile?.data, data);
    } catch (err: any) {
      setGeneralError(`Failed to read Weekly Sales file: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExcelTemplate = () => {
    const blob = generateExcelWorkbookTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Retail_Performance_Dataset_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSVFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (!storeMasterFile && !weeklySalesFile) {
      setGeneralError('Please upload an Excel workbook (.xlsx / .xls) or data files above before applying.');
      return;
    }

    const finalStores = storeMasterFile ? storeMasterFile.data : [];
    const finalSales = weeklySalesFile ? weeklySalesFile.data : [];

    if (finalStores.length === 0 && finalSales.length === 0) {
      setGeneralError('Please upload at least one valid Excel or CSV dataset with records.');
      return;
    }

    onApplyData(finalStores, finalSales);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#e2e8f0]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 text-[#3b82f6] rounded-md flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Upload Retail Performance Data (Excel / CSV)
              </h3>
            </div>
            <p className="text-xs text-[#64748b] mt-1">
              Supports Microsoft Excel workbooks (<strong>.xlsx</strong>, <strong>.xls</strong>) with multi-sheet detection, or separate files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Downloads Section */}
        <div className="my-4 p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
              Need an Excel template?
            </div>
            <span className="text-[#64748b] text-[11px]">
              Download ready-to-use formatted Excel workbook containing both sheets and sample rows.
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              onClick={downloadExcelTemplate}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-md font-medium text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Excel Workbook (.xlsx)
            </button>
            <button
              onClick={() =>
                downloadCSVFile(getStoreMasterCSVTemplate(), 'store_master_template.csv')
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#e2e8f0] hover:bg-slate-50 text-slate-700 rounded-md font-medium text-xs transition-colors"
            >
              <Download className="w-3 h-3 text-slate-400" />
              Store CSV
            </button>
            <button
              onClick={() =>
                downloadCSVFile(getWeeklySalesCSVTemplate(), 'retail_weekly_sales_template.csv')
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#e2e8f0] hover:bg-slate-50 text-slate-700 rounded-md font-medium text-xs transition-colors"
            >
              <Download className="w-3 h-3 text-slate-400" />
              Sales CSV
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center border-b border-[#e2e8f0] mb-4">
          <button
            onClick={() => setUploadMode('combined')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              uploadMode === 'combined'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#64748b] hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Complete Excel Workbook (.xlsx)
            <span className="text-[10px] bg-blue-50 text-[#3b82f6] px-1.5 py-0.2 rounded font-normal">
              Zero-Edit
            </span>
          </button>
          <button
            onClick={() => setUploadMode('separate')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              uploadMode === 'separate'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#64748b] hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Separate Files (Excel / CSV)
          </button>
          <button
            onClick={() => setUploadMode('paste')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              uploadMode === 'paste'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#64748b] hover:text-slate-900'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            Paste from Excel Clipboard
          </button>
        </div>

        {/* Option 1: Combined Excel Workbook Upload */}
        {uploadMode === 'combined' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50/70 border border-blue-200/70 rounded-lg text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-[#3b82f6] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Zero Manual File Edits Required:</span>
                <span className="text-blue-800 ml-1">
                  Upload your Excel spreadsheet directly. The engine automatically handles banner rows, header synonyms (e.g. &ldquo;Location ID&rdquo;, &ldquo;Branch&rdquo;, &ldquo;Gross Sales&rdquo;), and auto-hydrates missing sheets without needing manual spreadsheet modifications.
                </span>
              </div>
            </div>

            <div className="border border-[#e2e8f0] rounded-lg p-5 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold text-slate-900">
                    Upload Single Excel File (.xlsx / .xls)
                  </span>
                </div>
                {workbookInfo && (
                  <span className="text-[11px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {workbookInfo.sheets.length} Sheets Detected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] mb-3">
                Upload your retail Excel spreadsheet. The engine automatically maps sheets named{' '}
                <code className="text-[#3b82f6] bg-slate-50 px-1 py-0.5 rounded">Store Master</code> and{' '}
                <code className="text-[#3b82f6] bg-slate-50 px-1 py-0.5 rounded">Weekly Sales</code> (or detects by column headers).
              </p>

              <input
                type="file"
                ref={workbookInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleWorkbookFile(f);
                }}
                className="hidden"
              />

              <div
                onClick={() => workbookInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleWorkbookFile(f);
                }}
                className="border-2 border-dashed border-[#e2e8f0] hover:border-[#3b82f6] rounded-lg p-6 text-center cursor-pointer bg-[#f8fafc] hover:bg-blue-50/20 transition-all"
              >
                {isProcessing ? (
                  <div className="text-xs text-[#3b82f6] font-medium animate-pulse">
                    Parsing Excel workbook sheets...
                  </div>
                ) : workbookInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800">
                      <FileCheck className="w-4 h-4 text-[#22c55e]" />
                      <span>{workbookInfo.fileName}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {storeMasterFile && (
                        <span className="text-[11px] bg-blue-50 text-[#3b82f6] border border-blue-100 px-2 py-0.5 rounded font-medium">
                          Store Master: {storeMasterFile.data.length} stores
                        </span>
                      )}
                      {weeklySalesFile && (
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-medium">
                          Weekly Sales: {weeklySalesFile.data.length} rows
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Click or drag another file to replace
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-6 h-6 text-[#3b82f6] mx-auto mb-1 opacity-70" />
                    <div className="text-xs text-slate-700 font-medium">
                      <span className="text-[#3b82f6] underline">Click to browse Excel file</span> or drag & drop here
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Supports .xlsx, .xls workbook with multiple sheets
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-[#e2e8f0] rounded-lg p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">1. Store Master</div>
                  <div className="text-[10px] text-[#64748b]">
                    {storeMasterFile
                      ? `${storeMasterFile.data.length} store records loaded`
                      : 'Pending Excel sheet or file'}
                  </div>
                </div>
                {storeMasterFile ? (
                  <span className="text-[10px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded">
                    Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
                    Waiting
                  </span>
                )}
              </div>

              <div className="border border-[#e2e8f0] rounded-lg p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">2. Weekly Sales</div>
                  <div className="text-[10px] text-[#64748b]">
                    {weeklySalesFile
                      ? `${weeklySalesFile.data.length} weekly records loaded`
                      : 'Pending Excel sheet or file'}
                  </div>
                </div>
                {weeklySalesFile ? (
                  <span className="text-[10px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded">
                    Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-[#64748b] bg-slate-100 px-2 py-0.5 rounded">
                    Waiting
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : uploadMode === 'separate' ? (
          /* Option 2: Separate Excel or CSV Files */
          <div className="space-y-4">
            {/* Zone 1: Store Master */}
            <div className="border border-[#e2e8f0] rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold text-slate-900">
                    File 1: Store Master (.xlsx, .xls, or .csv)
                  </span>
                </div>
                {storeMasterFile && (
                  <span className="text-[11px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {storeMasterFile.data.length} Stores Parsed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] mb-3">
                Expected columns: <code className="text-[#3b82f6] bg-slate-50 px-1 py-0.5 rounded">store_id, store_name, region, format, size_sqft, city, state, manager</code>
              </p>

              <input
                type="file"
                ref={storeInputRef}
                accept=".xlsx,.xls,.csv,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleStoreMasterFile(f);
                }}
                className="hidden"
              />

              <div
                onClick={() => storeInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleStoreMasterFile(f);
                }}
                className="border-2 border-dashed border-[#e2e8f0] hover:border-[#3b82f6] rounded-lg p-4 text-center cursor-pointer bg-[#f8fafc] hover:bg-blue-50/20 transition-all"
              >
                {storeMasterFile ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800">
                    <FileCheck className="w-4 h-4 text-[#22c55e]" />
                    <span>{storeMasterFile.name}</span>
                    <span className="text-[#64748b]">({storeMasterFile.data.length} records)</span>
                  </div>
                ) : (
                  <div className="text-xs text-[#64748b]">
                    <span className="font-semibold text-[#3b82f6] hover:underline">
                      Click to browse Excel / CSV
                    </span>{' '}
                    or drag & drop Store Master file
                  </div>
                )}
              </div>
            </div>

            {/* Zone 2: Retail Weekly Sales */}
            <div className="border border-[#e2e8f0] rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold text-slate-900">
                    File 2: Retail Weekly Sales (.xlsx, .xls, or .csv)
                  </span>
                </div>
                {weeklySalesFile && (
                  <span className="text-[11px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {weeklySalesFile.data.length} Rows Parsed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] mb-3">
                Expected columns: <code className="text-[#3b82f6] bg-slate-50 px-1 py-0.5 rounded">store_id, week, week_date, sales, target_sales, transactions, units_sold</code>
              </p>

              <input
                type="file"
                ref={salesInputRef}
                accept=".xlsx,.xls,.csv,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleWeeklySalesFile(f);
                }}
                className="hidden"
              />

              <div
                onClick={() => salesInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleWeeklySalesFile(f);
                }}
                className="border-2 border-dashed border-[#e2e8f0] hover:border-[#3b82f6] rounded-lg p-4 text-center cursor-pointer bg-[#f8fafc] hover:bg-blue-50/20 transition-all"
              >
                {weeklySalesFile ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-800">
                    <FileCheck className="w-4 h-4 text-[#22c55e]" />
                    <span>{weeklySalesFile.name}</span>
                    <span className="text-[#64748b]">({weeklySalesFile.data.length} rows)</span>
                  </div>
                ) : (
                  <div className="text-xs text-[#64748b]">
                    <span className="font-semibold text-[#3b82f6] hover:underline">
                      Click to browse Excel / CSV
                    </span>{' '}
                    or drag & drop Weekly Sales file
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : uploadMode === 'paste' ? (
          <div className="space-y-4">
            <div className="border border-[#e2e8f0] rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-xs font-semibold text-slate-900">
                    Paste Direct from Spreadsheet (Copy & Paste Cells)
                  </span>
                </div>
                {(storeMasterFile || weeklySalesFile) && (
                  <span className="text-[11px] font-semibold text-[#22c55e] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Data Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] mb-2">
                Select your cells in Excel or Google Sheets, press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Ctrl+C</kbd> / <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Cmd+C</kbd>, and paste here. Tab-delimited and CSV formats are parsed automatically.
              </p>

              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste copied table cells here... (e.g. Store ID, Store Name, Sales, Target, City...)"
                className="w-full text-xs font-mono p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#3b82f6] bg-slate-50/50 resize-y"
              />

              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] text-slate-500">
                  {pastedText ? `${pastedText.split('\n').filter(Boolean).length} rows pasted` : 'No text pasted yet'}
                </span>
                <button
                  type="button"
                  onClick={handlePasteTable}
                  disabled={!pastedText.trim() || isProcessing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#3b82f6] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 rounded-md transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Parse Clipboard Data</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Intelligent Auto Extraction Notice */}
        {autoExtractionNotice && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>{autoExtractionNotice}</p>
          </div>
        )}

        {/* General Error if any */}
        {generalError && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>{generalError}</p>
          </div>
        )}

        {/* Validation Warning if present */}
        {validationWarning && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{validationWarning}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onResetToSample();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748b] hover:text-slate-900 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Benchmark 5-Region Dataset ({currentStoreCount} stores)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-apply-dataset"
              onClick={handleApply}
              disabled={isProcessing}
              title={
                storeMasterFile || weeklySalesFile
                  ? 'Apply parsed dataset to update regional dashboard'
                  : 'Click to apply or see required dataset files'
              }
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all inline-flex items-center gap-1.5 shadow-xs ${
                storeMasterFile || weeklySalesFile
                  ? 'bg-[#3b82f6] hover:bg-blue-600 text-white cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer active:scale-[0.98]'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  storeMasterFile || weeklySalesFile ? 'text-white' : 'text-slate-400'
                }`}
              />
              <span>Apply & Update Dashboard</span>
              {(storeMasterFile || weeklySalesFile) && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/25 text-white rounded font-semibold">
                  {(storeMasterFile?.data.length || 0) + (weeklySalesFile?.data.length || 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
