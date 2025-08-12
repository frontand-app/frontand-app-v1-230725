import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DownloadIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  FileTextIcon,
  TableIcon
} from "lucide-react";

export interface TableData {
  columns: Array<{
  key: string;
  label: string;
    type: 'text' | 'number' | 'status' | 'date' | 'currency' | 'email';
  sortable?: boolean;
  filterable?: boolean;
    width?: string;
  }>;
  rows: Array<Record<string, any>>;
  metadata?: {
    totalRows?: number;
    successfulRows?: number;
    failedRows?: number;
    processingTime?: string;
    model?: string;
    [key: string]: any;
  };
}

interface TableOutputProps {
  data: TableData;
  title?: string;
  enableSearch?: boolean;
  enableExport?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  maxHeight?: string;
}

export const TableOutput: React.FC<TableOutputProps> = ({
  data,
  title = "Results",
  enableSearch = true,
  enableExport = true,
  enablePagination = true,
  pageSize = 10,
  maxHeight = "600px"
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const toDisplayString = (value: any, pretty: boolean = false): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, pretty ? null : undefined, pretty ? 2 : undefined);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  // Sort and filter data
  const processedData = useMemo(() => {
    let filtered = data.rows;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        Object.values(row).some(value => toDisplayString(value).toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = toDisplayString(aVal).toLowerCase();
      const bStr = toDisplayString(bVal).toLowerCase();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [data.rows, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = enablePagination 
    ? processedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : processedData;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
  };

  const downloadJSON = () => {
    const jsonData = {
      title,
      metadata: data.metadata,
      results: processedData
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const headers = data.columns.map(col => col.label);
    const rows = processedData.map(row => 
      data.columns.map(col => {
        const value = row[col.key];
        const stringValue = toDisplayString(value);
        // Escape quotes and wrap in quotes if contains comma/quote
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      })
    );
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">{title}</CardTitle>
            {data.metadata && (
              <CardDescription className="mt-2">
                <div className="flex flex-wrap gap-4 text-sm">
                {data.metadata.totalRows && (
                    <span className="flex items-center gap-1">
                      <TableIcon className="w-4 h-4" />
                      {data.metadata.totalRows} total rows
                    </span>
                )}
                {data.metadata.processingTime && (
                    <span>⏱️ {data.metadata.processingTime}</span>
                )}
                  {data.metadata.model && (
                    <span>🤖 {data.metadata.model}</span>
                )}
              </div>
              </CardDescription>
            )}
          </div>
          
            {enableExport && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadCSV}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadJSON}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                JSON
              </Button>
            </div>
            )}
        </div>

        {enableSearch && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden border rounded-lg">
          <div className="overflow-x-auto" style={{ maxHeight }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                {data.columns.map((column) => (
                    <th
                    key={column.key}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                      style={{ width: column.width }}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable !== false && sortColumn === column.key && (
                          sortDirection === 'asc' 
                            ? <ArrowUpIcon className="w-3 h-3" />
                            : <ArrowDownIcon className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedData.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    {data.columns.map((column) => {
                      const value = row[column.key];
                      
                      return (
                        <td key={column.key} className="px-4 py-3 text-sm">
                          {column.type === 'status' ? (
                            <Badge 
                              variant={value === 'processed' ? 'default' : 'destructive'}
                            >
                              {value}
                            </Badge>
                          ) : column.type === 'currency' && typeof value === 'number' ? (
                            <span className="font-medium">
                              ${value.toFixed(2)}
                            </span>
                          ) : column.key === 'rationale' ? (
                            <div className="max-w-lg min-w-0">
                              <p className="text-gray-700 leading-relaxed text-sm whitespace-normal break-words">
                                {String(value || '')}
                              </p>
                            </div>
                      ) : (
                        typeof value === 'object' && value !== null ? (
                          <pre className="text-xs whitespace-pre-wrap break-all max-h-40 overflow-auto p-2 bg-gray-50 rounded">
                            {toDisplayString(value, true)}
                          </pre>
                        ) : (
                          <span className={column.type === 'number' ? 'font-medium' : ''}>
                            {toDisplayString(value)}
                          </span>
                        )
                      )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
                        </div>
        </div>

        {enablePagination && totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-700">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, processedData.length)} of {processedData.length} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {data.metadata && (data.metadata.successfulRows || data.metadata.failedRows) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Processing Summary:</strong>
              {data.metadata.successfulRows && (
                <span className="ml-2 text-green-600">
                  ✅ {data.metadata.successfulRows} successful
                </span>
              )}
              {data.metadata.failedRows && (
                <span className="ml-2 text-red-600">
                  ❌ {data.metadata.failedRows} failed
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
 