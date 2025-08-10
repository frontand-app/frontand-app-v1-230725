import React, { useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const initialTab = uploadedFileName ? 'file' : 'text';
  const [activeTab, setActiveTab] = useState<'text' | 'file'>(initialTab as 'text' | 'file');

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

  const linesDetected = useMemo(() => {
    if (!value) return 0;
    return value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0).length;
  }, [value]);

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'file')}>
        <TabsList className="h-8">
          <TabsTrigger value="text" className="text-xs">Text Input</TabsTrigger>
          <TabsTrigger value="file" className="text-xs">File Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-2">
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[96px] resize-none font-mono text-sm"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {linesDetected > 0 && (
              <>
                <FileText className="inline w-3 h-3 mr-1" />
                {linesDetected} {linesDetected === 1 ? 'line' : 'lines'} detected
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="file" className="mt-2">
          <div
            className="relative border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer border-border hover:border-foreground/50 hover:bg-secondary/30"
            onClick={onRequestFileDialog || openFileDialog}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (files?.[0]) onFilePicked(files[0]);
            }}
          >
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground">
              {uploadedFileName ? 'Click to replace file' : 'Click to upload CSV (or drop it here)'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Up to 10MB</p>
          </div>

          {uploadedFileName && (
            <div className="flex items-center justify-between p-2 bg-secondary rounded border mt-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-[70%]">{uploadedFileName}</span>
              </div>
              {onClearFile && (
                <button type="button" onClick={onClearFile} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CsvPlaintextInput;

