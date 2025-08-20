import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  FileText,
  Search,
  Eye
} from 'lucide-react';
import { normalizeResult } from '@/lib/normalizers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ExecutionFile {
  id: string;
  name: string;
  type: string;
  size: number;
  downloadUrl: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  progress?: number;
  inputData: Record<string, any>;
  results?: any;
  files?: ExecutionFile[];
  costCredits: number;
  estimatedTime?: number;
  actualTime?: number;
  errorMessage?: string;
}

const ExecutionDashboard: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<WorkflowExecution[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const escapeCsv = (value: any) => {
    const s = value === null || value === undefined ? '' : String(value);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const downloadExecutionsCSV = () => {
    const headers = [
      'id',
      'workflow_id',
      'workflow_name',
      'status',
      'created_at',
      'completed_at',
      'duration_seconds',
      'cost_credits',
      'progress',
      'files_count'
    ];
    const lines = filteredExecutions.map((e) => [
      e.id,
      e.workflowId,
      e.workflowName,
      e.status,
      e.createdAt,
      e.completedAt || '',
      e.actualTime ?? '',
      typeof e.costCredits === 'number' ? e.costCredits.toFixed(2) : '',
      e.progress ?? '',
      e.files?.length ?? 0
    ].map(escapeCsv).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executions_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadResultCSV = (execution: WorkflowExecution) => {
    try {
      const normalized = normalizeResult(execution.workflowId, execution.results);
      const rows = normalized.rows;
      if (!rows || rows.length === 0) return;
      const headers = normalized.columns;
      const escape = (v: any) => {
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(',') || s.includes('\n') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${execution.workflowName.replace(/\s+/g,'_').toLowerCase()}_${execution.id}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Load executions and subscribe to changes/poll
  useEffect(() => {
    let isMounted = true;
    let interval: number | undefined;
    (async () => {
      try {
        const api = await import('@/lib/executionApi');
        const data = await api.getExecutions();
        if (!isMounted) return;
        setExecutions(data as unknown as WorkflowExecution[]);
        setFilteredExecutions(data as unknown as WorkflowExecution[]);
        // Lightweight polling every 1s to reflect progress and new runs
        interval = window.setInterval(async () => {
          const latest = await api.getExecutions();
          if (!isMounted) return;
          setExecutions(latest as unknown as WorkflowExecution[]);
        }, 1000);
      } catch (e) {
        if (!isMounted) return;
        setExecutions([]);
        setFilteredExecutions([]);
      }
    })();
    return () => {
      isMounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, []);

  // Filter executions based on status and search query
  useEffect(() => {
    let filtered = executions;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exec => exec.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(exec => 
        exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredExecutions(filtered);
  }, [executions, statusFilter, searchQuery]);





  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const retryExecution = (execution: WorkflowExecution) => {
    // In real implementation, this would retry the workflow
    console.log('Retrying execution:', execution.id);
  };

  const cancelExecution = (execution: WorkflowExecution) => {
    // In real implementation, this would cancel the running workflow
    setExecutions(prev => prev.map(exec => 
      exec.id === execution.id ? { ...exec, status: 'cancelled' as const } : exec
    ));
  };

  const runningExecutions = executions.filter(e => e.status === 'running');
  const queuedExecutions = executions.filter(e => e.status === 'queued');
  const completedExecutions = executions.filter(e => e.status === 'completed');
  const failedExecutions = executions.filter(e => e.status === 'failed');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Executions</h1>
        <p className="text-gray-600">
          Track and manage your workflow runs
        </p>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">{runningExecutions.length} Running</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm text-gray-600">{queuedExecutions.length} Queued</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">{completedExecutions.length} Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600">{failedExecutions.length} Failed</span>
        </div>
      </div>

      {/* Search, Filter, Export */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search executions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gray-300 focus:ring-1 focus:ring-gray-300 bg-white"
        >
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="queued">Queued</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Remove top-right floating CSV; keep inline export for filtered list if desired */}
      </div>

      {/* Executions Table */}
      {filteredExecutions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No executions found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Start running workflows to see them here'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button className="bg-black hover:bg-gray-800 text-white" asChild>
                              <a href="/search">
                <Play className="h-4 w-4 mr-2" />
                Run Workflow
              </a>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Workflow</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Started</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Files</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map((execution, index) => (
                  <tr key={execution.id} className={`hover:bg-gray-50 ${index !== filteredExecutions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{execution.workflowName}</div>
                        <div className="text-xs text-gray-500">{execution.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          execution.status === 'running' ? 'bg-blue-500' :
                          execution.status === 'completed' ? 'bg-green-500' :
                          execution.status === 'failed' ? 'bg-red-500' :
                          execution.status === 'queued' ? 'bg-gray-400' :
                          'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm text-gray-700 capitalize">{execution.status}</span>
                      </div>
                      {execution.status === 'running' && execution.progress !== undefined && (
                        <div className="mt-2 w-24">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${execution.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{execution.progress}%</div>
                        </div>
                      )}
                      {execution.errorMessage && (
                        <div className="text-xs text-red-600 mt-1 max-w-32 truncate" title={execution.errorMessage}>
                          {execution.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-700">
                        {new Date(execution.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(execution.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {execution.actualTime ? (
                        <div className="text-sm text-gray-700">{formatDuration(execution.actualTime)}</div>
                      ) : execution.estimatedTime ? (
                        <div className="text-sm text-gray-500">~{formatDuration(execution.estimatedTime)}</div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-700">{execution.costCredits}</div>
                      <div className="text-xs text-gray-500">credits</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        {/* Per-execution CSV derived from results */}
                        {execution.status === 'completed' && execution.results && (
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                            onClick={() => downloadResultCSV(execution)}
                            title="Download CSV"
                          >
                            <Download className="h-3 w-3" /> CSV
                          </button>
                        )}
                        {/* Backend-provided files (e.g., JSON) */}
                        {execution.files && execution.files.length > 0 && execution.files.slice(0, 2).map((file) => (
                          <button
                            key={file.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                            onClick={() => window.open(file.downloadUrl, '_blank')}
                            title={`${file.name} (${formatFileSize(file.size)})`}
                          >
                            <Download className="h-3 w-3" />
                            {file.type.toUpperCase()}
                          </button>
                        ))}
                        {execution.files && execution.files.length > 2 && (
                          <div className="text-xs text-gray-500 self-center px-1">
                            +{execution.files.length - 2}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        {execution.status === 'running' && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            onClick={() => cancelExecution(execution)}
                            title="Cancel"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        {execution.status === 'failed' && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            onClick={() => retryExecution(execution)}
                            title="Retry"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button 
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Execution {execution.id}</DialogTitle>
                            </DialogHeader>
                            <div className="text-xs overflow-auto max-h-[70vh] p-2 bg-gray-50 rounded">
                              <pre>{JSON.stringify(execution.results ?? execution, null, 2)}</pre>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionDashboard; 