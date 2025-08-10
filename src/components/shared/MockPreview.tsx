import React from 'react';
import { Button } from '@/components/ui/button';

interface MockPreviewProps {
  title?: string;
  filename?: string | null;
  onUploadNew?: () => void;
  children: React.ReactNode;
}

const MockPreview: React.FC<MockPreviewProps> = ({
  title = 'Preview',
  filename,
  onUploadNew,
  children,
}) => {
  return (
    <div className="text-sm bg-secondary/40 border border-border rounded p-3">
      <div className="font-medium text-foreground mb-1">{title}</div>
      <div className="text-muted-foreground max-h-48 overflow-auto">{children}</div>
      <div className="pt-2 mt-2 border-t text-foreground flex items-center justify-between">
        {filename ? <span className="text-sm truncate max-w-[70%]">✓ {filename}</span> : <span />}
        {onUploadNew && (
          <Button variant="outline" size="sm" onClick={onUploadNew}>
            Upload new
          </Button>
        )}
      </div>
    </div>
  );
};

export default MockPreview;

