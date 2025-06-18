
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface FileUploadCardProps {
  title: string;
  id: string;
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  id,
  file,
  onFileChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor={id}>Chọn file Excel (.xlsx)</Label>
          <Input
            id={id}
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileChange}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Đã chọn: {file.name}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadCard;
