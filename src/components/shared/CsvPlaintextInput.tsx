import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';

interface CsvPlaintextInputProps {
  id: string;
  value: string;
  placeholder?: string;
  uploadedFileName?: string | null;
  onChange: (value: string) => void;
  onFilePicked: (file: File) => void;
  onClearFile?: () => void;
  onRequestFileDialog?: () => void;
}

const CsvPlaintextInput: React.FC<CsvPlaintextInputProps> = ({
  id,
  value,
  placeholder,
  uploadedFileName,
  onChange,
  onFilePicked,
  onClearFile,
  onRequestFileDialog,
}) => {
  const openFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFilePicked(file);
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-xs text-muted-foreground mb-2">
        <span>Text Input</span>
        <span className="text-gray-300">|</span>
        <span>File Upload</span>
      </div>

      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] resize-none font-mono text-sm"
      />

      <div
        className="relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer border-border hover:border-foreground/50 hover:bg-secondary/30"
        onClick={onRequestFileDialog || openFileDialog}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files?.[0]) onFilePicked(files[0]);
        }}
      >
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-foreground">
          {uploadedFileName ? 'Click to replace file' : 'Drop your CSV file here or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Supports CSV files up to 10MB</p>
      </div>

      {uploadedFileName && (
        <div className="flex items-center justify-between p-2 bg-secondary rounded border mt-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{uploadedFileName}</span>
          </div>
          {onClearFile && (
            <button type="button" onClick={onClearFile} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {value && (
        <div className="text-sm text-muted-foreground bg-secondary/40 px-3 py-2 rounded border border-border">
          <FileText className="w-4 h-4 inline mr-2" />
          {value.split('\n').length} lines detected
        </div>
      )}
    </div>
  );
};

export default CsvPlaintextInput;

