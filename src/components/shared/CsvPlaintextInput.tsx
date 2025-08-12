import React, { useMemo, useState, useEffect } from 'react';
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
  forceSingleHeader?: string; // when provided, preview as 1-column CSV with this header
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
  forceSingleHeader,
}) => {
  const initialTab = uploadedFileName ? 'file' : 'text';
  const [activeTab, setActiveTab] = useState<'text' | 'file'>(initialTab as 'text' | 'file');
  const [isEditing, setIsEditing] = useState<boolean>(!value);

  useEffect(() => {
    // If value becomes available (e.g., file upload), default to preview mode
    if (value && value.length > 0 && uploadedFileName && activeTab === 'file') {
      setIsEditing(false);
    }
  }, [value, uploadedFileName, activeTab]);

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

  const csvPreview = useMemo(() => {
    if (!value) return null;
    const lines = value.split('\n').filter(Boolean);
    if (lines.length === 0) return null;
    // naive CSV parse with quote handling for preview only
    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          result.push(current.trim().replace(/^\"|\"$/g, ''));
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim().replace(/^\"|\"$/g, ''));
      return result;
    };
    let header: string[];
    let rows: string[][];
    let totalRows = 0;
    const rowsToShow = 20;
    const firstLine = lines[0] ?? '';
    const shouldForceSingle = Boolean(forceSingleHeader && !firstLine.includes(',') && firstLine.trim().toLowerCase() !== forceSingleHeader.trim().toLowerCase() && lines.every(l => !l.includes(',')));

    if (shouldForceSingle) {
      header = [forceSingleHeader as string];
      totalRows = lines.length;
      rows = lines.slice(0, rowsToShow).map((l) => [l.trim()]);
    } else {
      header = parseLine(firstLine);
      totalRows = Math.max(lines.length - 1, 0);
      rows = lines.slice(1).slice(0, rowsToShow).map(parseLine); // first N rows for preview
    }
    return { header, rows, totalRows };
  }, [value, forceSingleHeader]);

  const shorten = (text: string, max = 200) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'file')}>
        <TabsList className="h-8">
          <TabsTrigger value="text" className="text-xs">Text Input</TabsTrigger>
          <TabsTrigger value="file" className="text-xs">File Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-2">
          {(!isEditing && value) ? (
            <div
              role="button"
              onClick={() => setIsEditing(true)}
              className="min-h-[96px] border rounded-md p-0 bg-background text-foreground cursor-text"
              title="Click to edit"
            >
              {csvPreview ? (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        {csvPreview.header.map((h, i) => (
                          <th key={i} className="text-left px-3 py-2 font-medium whitespace-pre-wrap break-words">{shorten(h, 80)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-background even:bg-secondary/40">
                          {csvPreview.header.map((_, i) => (
                            <td key={i} className="px-3 py-2 whitespace-pre-wrap break-words align-top" title={r[i] ?? ''}>{shorten(r[i] ?? '', 160)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 font-mono text-sm whitespace-pre-wrap leading-5 max-h-64 overflow-auto">{value}</div>
              )}
              <div className="px-3 pb-2 pt-1 text-xs text-muted-foreground">
                <FileText className="inline w-3 h-3 mr-1" />
                {csvPreview ? `${csvPreview.totalRows} rows total · Previewing first ${Math.min(csvPreview.totalRows, csvPreview.rows.length)}` : ''} · Click to edit
              </div>
            </div>
          ) : (
            <>
              <Textarea
                id={id}
                placeholder={placeholder || 'Paste CSV with headers in first row...'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[96px] resize-none font-mono text-sm leading-5"
                onBlur={() => setIsEditing(false)}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {linesDetected > 0 && (
                  <>
                    <FileText className="inline w-3 h-3 mr-1" />
                    {linesDetected} {linesDetected === 1 ? 'line' : 'lines'} detected
                  </>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="file" className="mt-2">
          {(!isEditing && value) ? (
            <div
              role="button"
              onClick={() => setIsEditing(true)}
              className="min-h-[96px] border rounded-md p-0 bg-background text-foreground cursor-text"
              title="Click to edit or replace"
            >
              {csvPreview ? (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        {csvPreview.header.map((h, i) => (
                          <th key={i} className="text-left px-3 py-2 font-medium whitespace-pre-wrap break-words">{shorten(h, 80)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-background even:bg-secondary/40">
                          {csvPreview.header.map((_, i) => (
                            <td key={i} className="px-3 py-2 whitespace-pre-wrap break-words align-top" title={r[i] ?? ''}>{shorten(r[i] ?? '', 160)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 font-mono text-sm whitespace-pre-wrap leading-5 max-h-64 overflow-auto">{value}</div>
              )}
              <div className="px-3 pb-2 pt-1 text-xs text-muted-foreground">
                <FileText className="inline w-3 h-3 mr-1" />
                {csvPreview ? `${csvPreview.totalRows} rows total · Previewing first ${Math.min(csvPreview.totalRows, csvPreview.rows.length)}` : ''} · Click to edit or replace
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CsvPlaintextInput;

