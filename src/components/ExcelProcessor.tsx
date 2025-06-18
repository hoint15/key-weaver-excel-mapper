
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

  const readExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
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

      // Parse mapping file
      const mappingData = await parseMappingFile(mappingFile);

      // Process data with mapping
      const processed = sourceData.map(row => {
        const newRow: ProcessedData = { ...row };

        Object.keys(row).forEach(column => {
          if (mappingData[column] && row[column]) {
            const mappedValue = mappingData[column][row[column] as string];
            if (mappedValue) {
              newRow[column] = mappedValue;
            }
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
