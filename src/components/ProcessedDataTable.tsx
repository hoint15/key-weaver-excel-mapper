
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { ProcessedData } from '@/utils/excelUtils';

interface ProcessedDataTableProps {
  data: ProcessedData[];
  onDownload: () => void;
}

const ProcessedDataTable: React.FC<ProcessedDataTableProps> = ({ data, onDownload }) => {
  const getTableColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kết quả xử lý</CardTitle>
        <Button onClick={onDownload} className="flex items-center gap-2">
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
              {data.slice(0, 10).map((row, index) => (
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
        {data.length > 10 && (
          <p className="text-sm text-muted-foreground mt-2">
            Hiển thị 10/{data.length} dòng đầu tiên
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessedDataTable;
