import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { readExcelFile, parseMappingFile, createExcelFile, ProcessedData } from '@/utils/excelUtils';
import { processDateColumns } from '@/utils/dateUtils';
import * as XLSX from 'xlsx';

export const useExcelProcessor = () => {
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

    createExcelFile(processedData);
    
    toast({
      title: "Thành công",
      description: "File đã được tải về thành công",
    });
  };

  return {
    sourceFile,
    mappingFile,
    processedData,
    isProcessing,
    handleSourceFileChange,
    handleMappingFileChange,
    processData,
    downloadProcessedFile
  };
};
