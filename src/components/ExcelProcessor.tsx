import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MappingData {
  [sheetName: string]: {
    [value: string]: string;
  };
}

interface ProcessedData {
  [key: string]: string | number;
}

const ExcelProcessor = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFile(file);
    }
  };

  const handleMappingFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMappingFile(file);
    }
  };

  // Function to check if a value is an Excel date serial number
  const isExcelDate = (value: any): boolean => {
    if (typeof value !== 'number') return false;
    // Excel date serial numbers are typically between 1 (1900-01-01) and 2958465 (9999-12-31)
    return value > 0 && value < 2958466 && value % 1 !== 0.999; // Exclude obvious non-dates
  };

  // Function to convert Excel date serial number to dd/mm/yyyy format
  const convertExcelDateToString = (serialNumber: number): string => {
    try {
      // Excel date base is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
      const baseDate = new Date(1900, 0, 1);
      const days = serialNumber - 1; // Subtract 1 because Excel starts from 1, not 0
      const resultDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      const day = resultDate.getDate().toString().padStart(2, '0');
      const month = (resultDate.getMonth() + 1).toString().padStart(2, '0');
      const year = resultDate.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.log('Error converting date:', error);
      return serialNumber.toString(); // Return original value if conversion fails
    }
  };

  // Function to detect and convert date columns
  const processDateColumns = (data: ProcessedData[]): ProcessedData[] => {
    if (data.length === 0) return data;

    // Detect potential date columns by checking if most values in a column are Excel date numbers
    const columns = Object.keys(data[0]);
    const dateColumns = new Set<string>();

    columns.forEach(column => {
      const columnName = column.toLowerCase();
      // Check if column name suggests it's a date field
      const isDateColumnName = columnName.includes('ngày') || 
                              columnName.includes('date') || 
                              columnName.includes('birth') || 
                              columnName.includes('sinh');

      if (isDateColumnName) {
        // Sample first few rows to see if they contain Excel date numbers
        const sampleSize = Math.min(5, data.length);
        let dateCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
          if (isExcelDate(data[i][column])) {
            dateCount++;
          }
        }
        
        // If more than half of sampled values are Excel dates, treat as date column
        if (dateCount > sampleSize / 2) {
          dateColumns.add(column);
          console.log(`Detected date column: ${column}`);
        }
      }
    });

    // Convert date columns
    return data.map(row => {
      const newRow = { ...row };
      dateColumns.forEach(column => {
        if (isExcelDate(row[column])) {
          const convertedDate = convertExcelDateToString(row[column] as number);
          newRow[column] = convertedDate;
          console.log(`Converted date in ${column}: ${row[column]} -> ${convertedDate}`);
        }
      });
      return newRow;
    });
  };

  const readExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
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

  const parseMappingFile = async (file: File): Promise<MappingData> => {
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

  const processData = async () => {
    if (!sourceFile || !mappingFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn cả hai file trước khi xử lý",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Read source file
      const sourceWorkbook = await readExcelFile(sourceFile);
      const sourceSheet = sourceWorkbook.Sheets[sourceWorkbook.SheetNames[0]];
      const sourceData = XLSX.utils.sheet_to_json(sourceSheet) as ProcessedData[];

      // Process date columns first
      const dataWithDates = processDateColumns(sourceData);

      // Parse mapping file
      const mappingData = await parseMappingFile(mappingFile);

      console.log('Mapping data:', mappingData);

      // Process data with mapping - only replace values that exist in mapping
      const processed = dataWithDates.map(row => {
        const newRow: ProcessedData = { ...row };

        Object.keys(row).forEach(column => {
          // Check if there's a mapping sheet for this column
          if (mappingData[column] && row[column] !== null && row[column] !== undefined) {
            const currentValue = row[column] as string;
            // Only replace if the exact value exists in the mapping
            if (mappingData[column][currentValue]) {
              newRow[column] = mappingData[column][currentValue];
              console.log(`Mapped ${column}: ${currentValue} -> ${mappingData[column][currentValue]}`);
            }
            // If no mapping found, keep the original value
          }
        });

        return newRow;
      });

      setProcessedData(processed);
      toast({
        title: "Thành công",
        description: "Dữ liệu đã được xử lý thành công",
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xử lý dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProcessedFile = () => {
    if (processedData.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có dữ liệu để tải về",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Data');

    XLSX.writeFile(workbook, 'processed_data.xlsx');
    
    toast({
      title: "Thành công",
      description: "File đã được tải về thành công",
    });
  };

  const getTableColumns = () => {
    if (processedData.length === 0) return [];
    return Object.keys(processedData[0]);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              File dữ liệu gốc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="source-file">Chọn file Excel (.xlsx)</Label>
              <Input
                id="source-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleSourceFileChange}
              />
              {sourceFile && (
                <p className="text-sm text-muted-foreground">
                  Đã chọn: {sourceFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              File mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mapping-file">Chọn file Excel (.xlsx)</Label>
              <Input
                id="mapping-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleMappingFileChange}
              />
              {mappingFile && (
                <p className="text-sm text-muted-foreground">
                  Đã chọn: {mappingFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          onClick={processData}
          disabled={!sourceFile || !mappingFile || isProcessing}
          className="flex items-center gap-2"
          size="lg"
        >
          <Upload className="w-4 h-4" />
          {isProcessing ? 'Đang xử lý...' : 'Xử lý dữ liệu'}
        </Button>
      </div>

      {/* Results Section */}
      {processedData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kết quả xử lý</CardTitle>
            <Button onClick={downloadProcessedFile} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Tải về
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getTableColumns().map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {getTableColumns().map((column) => (
                        <TableCell key={column}>
                          {row[column]?.toString() || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {processedData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                Hiển thị 10/{processedData.length} dòng đầu tiên
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExcelProcessor;
