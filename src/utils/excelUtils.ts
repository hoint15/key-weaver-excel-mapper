
import * as XLSX from 'xlsx';

export interface MappingData {
  [sheetName: string]: {
    [value: string]: string;
  };
}

export interface ProcessedData {
  [key: string]: string | number;
}

export const readExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false }); // Keep as numbers for date detection
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseMappingFile = async (file: File): Promise<MappingData> => {
  const workbook = await readExcelFile(file);
  const mappingData: MappingData = {};

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{ value: string; key: string }>;
    
    mappingData[sheetName] = {};
    jsonData.forEach(row => {
      if (row.value && row.key) {
        mappingData[sheetName][row.value] = row.key;
      }
    });
  });

  return mappingData;
};

export const createExcelFile = (data: ProcessedData[]): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Data');
  XLSX.writeFile(workbook, 'processed_data.xlsx');
};
