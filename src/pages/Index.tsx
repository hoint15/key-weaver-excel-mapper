/* =====================================
   PLACE THESE FILES EXACTLY AS NAMED
   ├─ components/ExcelProcessor.tsx
   ├─ utils/date.ts
   └─ pages/index.tsx
   ===================================== */

/* ================= utils/date.ts ================= */
export const buildDob = (
  year?: number | string,
  month?: number | string,
  day?: number | string,
): string => {
  if (!year || !month || !day) return '';
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

/* ============== components/ExcelProcessor.tsx ============== */
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { buildDob } from '../utils/date'; // 🠕 đường dẫn tương đối

type RowData = Record<string, any>;

const ExcelProcessor = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<RowData[]>([]);

  /* ---------- helpers ---------- */
  const fileToWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
    const data = await file.arrayBuffer();
    return XLSX.read(data, { type: 'array' });
  };

  const buildMappings = (mapWb: XLSX.WorkBook) => {
    const dict: Record<string, Record<string, string>> = {};
    mapWb.SheetNames.forEach((sheetName) => {
      const sheet = mapWb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<{ value: string; key: string }>(sheet, { header: 0 });
      const map: Record<string, string> = {};
      rows.forEach(({ value, key }) => {
        if (value !== undefined && key !== undefined) map[value] = key;
      });
      dict[sheetName] = map;
    });
    return dict;
  };

  const handleProcess = async () => {
    if (!sourceFile || !mappingFile) return alert('Vui lòng tải đủ 2 file.');

    const [srcWb, mapWb] = await Promise.all([
      fileToWorkbook(sourceFile),
      fileToWorkbook(mappingFile),
    ]);

    const firstSheetName = srcWb.SheetNames[0];
    const srcRows = XLSX.utils.sheet_to_json<RowData>(srcWb.Sheets[firstSheetName], { defval: '' });

    const mappingDict = buildMappings(mapWb);

    const processedRows = srcRows.map((row) => {
      const mapped: RowData = { ...row };

      // 1️⃣ mapping value ➜ key
      Object.keys(mapped).forEach((col) => {
        const sheetMap = mappingDict[col];
        if (sheetMap) {
          const original = mapped[col];
          mapped[col] = sheetMap[original] ?? original;
        }
      });

      // 2️⃣ dob
      mapped.dob = buildDob(mapped.birthday_year, mapped.birthday_month, mapped.birthday_day);

      // 3️⃣ attendant_template_id (sau cùng)
      if (mappingDict['attendant_template']) {
        mapped.attendant_template_id = mappingDict['attendant_template'][mapped.attendant_template] ?? mapped.attendant_template;
      } else {
        mapped.attendant_template_id = mapped.attendant_template;
      }

      return mapped;
    });

    setPreviewRows(processedRows.slice(0, 50));

    // ✅ Export
    const ws = XLSX.utils.json_to_sheet(processedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Processed');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'processed.xlsx');
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-4">
      {/* Uploads & button */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setSourceFile(e.target.files?.[0] ?? null)}
          className="file:py-2 file:px-4 file:bg-indigo-600 file:text-white file:rounded hover:file:bg-indigo-700"
        />
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setMappingFile(e.target.files?.[0] ?? null)}
          className="file:py-2 file:px-4 file:bg-indigo-600 file:text-white file:rounded hover:file:bg-indigo-700"
        />
        <button
          onClick={handleProcess}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg w-full md:w-auto"
        >
          Xử lý dữ liệu
        </button>
      </div>

      {/* preview table */}
      {previewRows.length > 0 && (
        <div className="overflow-x-auto max-h-96 border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {Object.keys(previewRows[0]).map((key) => (
                  <th key={key} className="px-3 py-2 font-semibold border-b whitespace-nowrap">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-3 py-1 border-b whitespace-nowrap">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExcelProcessor;

/* ====================== pages/index.tsx ====================== */
import ExcelProcessor from '../components/ExcelProcessor'; // 🠕 đường dẫn tương đối

const Index = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Excel Data Processor</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your source Excel file and mapping file.<br />
          Hệ thống sẽ tự thêm <code>dob</code> &amp; <code>attendant_template_id</code>.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-xl p-6">
        <ExcelProcessor />
      </div>
    </div>
  </div>
);

export default Index;
