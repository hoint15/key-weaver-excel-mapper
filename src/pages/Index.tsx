import ExcelProcessor from '@/components/ExcelProcessor';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Excel Data Processor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your source Excel file and mapping file to transform data values. <br />
            Các cột mới <code>dob</code> (yyyy-mm-dd) và <code>attendant_template_id</code> sẽ tự động được tạo sau khi xử lý.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <ExcelProcessor />
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Hướng dẫn sử dụng</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Upload Files</h3>
                <p className="text-gray-600">
                  Tải lên file dữ liệu gốc và file mapping. File mapping phải có các sheet tương ứng với cột trong file gốc.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. Process Data</h3>
                <p className="text-gray-600">
                  Nhấn nút "Xử lý dữ liệu" để thực hiện mapping. Hệ thống sẽ thêm <code>dob</code> và <code>attendant_template_id</code> sau cùng.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">3. Download Result</h3>
                <p className="text-gray-600">
                  Xem trước kết quả trong table và tải về file Excel đã được xử lý.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

/* ===============================
   utils/date.ts
   =============================== */
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

/* ===============================
   components/ExcelProcessor.tsx
   =============================== */
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { buildDob } from '@/utils/date';

interface RowData {
  [key: string]: any;
}

const ExcelProcessor = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<RowData[]>([]);

  // ---------- helpers ----------
  const fileToWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
    const data = await file.arrayBuffer();
    return XLSX.read(data, { type: 'array' });
  };

  const buildMappings = (mapWb: XLSX.WorkBook): Record<string, Record<string, string>> => {
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

    // Đọc file
    const [srcWb, mapWb] = await Promise.all([fileToWorkbook(sourceFile), fileToWorkbook(mappingFile)]);

    // Giả thiết sheet đầu tiên là dữ liệu
    const firstSheetName = srcWb.SheetNames[0];
    const srcRows = XLSX.utils.sheet_to_json<RowData>(srcWb.Sheets[firstSheetName], { defval: '' });

    // Tạo dict mapping cho từng sheet
    const mappingDict = buildMappings(mapWb);

    const processedRows: RowData[] = srcRows.map((row) => {
      const mapped: RowData = { ...row };

      // ------- 1. Áp dụng mapping value -> key cho từng cột -------
      Object.keys(mapped).forEach((col) => {
        const mapSheet = mappingDict[col];
        if (mapSheet) {
          const original = mapped[col];
          mapped[col] = mapSheet[original] ?? original; // fallback giữ nguyên nếu không có mapping
        }
      });

      // ------- 2. Tạo cột dob sau khi cột birthday_* đã xử lý xong -------
      mapped.dob = buildDob(mapped.birthday_year, mapped.birthday_month, mapped.birthday_day);

      // ------- 3. attendant_template_id (làm sau cùng) -------
      if (mappingDict['attendant_template']) {
        // Nếu sheet mapping riêng cho attendant_template
        const id = mappingDict['attendant_template'][mapped.attendant_template] ?? mapped.attendant_template;
        mapped.attendant_template_id = id;
      } else {
        // Trường hợp đã mapping thành ID ngay bước 1
        mapped.attendant_template_id = mapped.attendant_template;
      }

      return mapped;
    });

    setPreviewRows(processedRows.slice(0, 50)); // show first 50 rows preview

    // ------- Xuất file -------
    const newWs = XLSX.utils.json_to_sheet(processedRows);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, 'Processed');
    const wbout = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'processed.xlsx');
  };

  // ---------- UI ----------
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setSourceFile(e.target.files?.[0] ?? null)}
          className="file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
        />
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setMappingFile(e.target.files?.[0] ?? null)}
          className="file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
        />
        <button
          onClick={handleProcess}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg w-full md:w-auto"
        >
          Xử lý dữ liệu
        </button>
      </div>

      {/* preview */}
      {previewRows.length > 0 && (
        <div className="overflow-x-auto max-h-96 border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {Object.keys(previewRows[0]).map((key) => (
                  <th key={key} className="px-3 py-2 font-semibold border-b">
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
