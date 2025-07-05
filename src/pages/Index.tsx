Below are **three separate files**. **Create each file exactly as named** in your project’s `src` folder (or adjust paths if you don’t use `src/`).  

> **Do NOT copy them all into a single file.**  
> Each file contains a *single* `export default` or named export to avoid duplicate‑symbol errors.

---

## 1. `utils/date.ts`
```ts
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
```

---

## 2. `components/ExcelProcessor.tsx`
```tsx
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { buildDob } from '../utils/date';

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

    const sheetName = srcWb.SheetNames[0];
    const srcRows = XLSX.utils.sheet_to_json<RowData>(srcWb.Sheets[sheetName], { defval: '' });

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

    // Export
    const ws = XLSX.utils.json_to_sheet(processedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Processed');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'processed.xlsx');
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setSourceFile(e.target.files?.[0] ?? null)} />
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setMappingFile(e.target.files?.[0] ?? null)} />
        <button onClick={handleProcess} className="bg-green-600 text-white px-4 py-2 rounded">Xử lý dữ liệu</button>
      </div>

      {previewRows.length > 0 && (
        <div className="overflow-x-auto max-h-96 border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {Object.keys(previewRows[0]).map((key) => (
                  <th key={key} className="px-3 py-2 font-semibold border-b whitespace-nowrap">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50">
                  {Object.values<RowData[keyof RowData]>(row).map((val, i) => (
                    <td key={i} className="px-3 py-1 border-b whitespace-nowrap">{String(val)}</td>
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
```

---

## 3. `pages/index.tsx`
```tsx
import ExcelProcessor from '../components/ExcelProcessor';

const Index = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Excel Data Processor</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your source Excel file and mapping file. System will auto‑generate <code>dob</code> &amp; <code>attendant_template_id</code>.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-xl p-6">
        <ExcelProcessor />
      </div>
    </div>
  </div>
);

export default Index;
```

---

### ⚠️ Lỗi trên Vercel vẫn xảy ra?

1. Xoá hẳn **các file cũ** (đặc biệt `src/pages/Index.tsx` trộn lẫn code).  
2. Tạo lại *ba* file trên đúng đường dẫn.  
3. Chạy `npm run build`/`vercel --prod`.

Bạn chỉ cần cho mình biết nếu log vẫn báo trùng `buildDob` hoặc `ExcelProcessor`. Khi đó 99 % là còn một file khác (hoặc đoạn code copy‑paste) khai báo lại những symbol đó. Hãy tìm và xoá đoạn thừa.
