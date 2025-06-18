
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useExcelProcessor } from '@/hooks/useExcelProcessor';
import FileUploadCard from '@/components/FileUploadCard';
import ProcessedDataTable from '@/components/ProcessedDataTable';

const ExcelProcessor = () => {
  const {
    sourceFile,
    mappingFile,
    processedData,
    isProcessing,
    handleSourceFileChange,
    handleMappingFileChange,
    processData,
    downloadProcessedFile
  } = useExcelProcessor();

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadCard
          title="File dữ liệu gốc"
          id="source-file"
          file={sourceFile}
          onFileChange={handleSourceFileChange}
        />
        <FileUploadCard
          title="File mapping"
          id="mapping-file"
          file={mappingFile}
          onFileChange={handleMappingFileChange}
        />
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
      <ProcessedDataTable
        data={processedData}
        onDownload={downloadProcessedFile}
      />
    </div>
  );
};

export default ExcelProcessor;
