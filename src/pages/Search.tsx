import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllWorkflows } from '@/config/workflows';
import { WorkflowConfig } from '@/components/WorkflowBase';
import { Search as SearchIcon, Clock, Users, ArrowRight, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import WorkflowDemo from '@/components/WorkflowDemo';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [demoWorkflow, setDemoWorkflow] = useState<WorkflowConfig | null>(null);
  const navigate = useNavigate();
  const allWorkflows = getAllWorkflows();

  // Simple but effective search algorithm
  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return allWorkflows;

    const query = searchQuery.toLowerCase();
    
    return allWorkflows.filter(workflow => {
      // Search in title
      if (workflow.title.toLowerCase().includes(query)) return true;
      
      // Search in description
      if (workflow.description.toLowerCase().includes(query)) return true;
      
      // Search in use cases if they exist
      if (workflow.visualExplanation?.useCases) {
        const useCasesText = workflow.visualExplanation.useCases.join(' ').toLowerCase();
        if (useCasesText.includes(query)) return true;
      }
      
      // Search in overview if it exists
      if (workflow.visualExplanation?.overview?.toLowerCase().includes(query)) return true;
      
      // Search for common phrases
      const searchTerms = {
        'csv': ['loop-over-rows'],
        'data': ['loop-over-rows'],
        'analysis': ['loop-over-rows'],
        'batch': ['loop-over-rows'],
        'process': ['loop-over-rows'],
        'company': ['loop-over-rows', 'crawl4imprint'],
        'logo': ['crawl4logo', 'transform-image'],
        'image': ['crawl4logo', 'transform-image'],
        'contact': ['crawl4contacts'],
        'email': ['crawl4contacts'],
        'blog': ['co-storm-blog-gen'],
        'content': ['co-storm-blog-gen'],
        'ai mentions': ['check-ai-mentions'],
        'monitoring': ['check-ai-mentions'],
        'imprint': ['crawl4imprint']
      };
      
      for (const [term, workflowIds] of Object.entries(searchTerms)) {
        if (query.includes(term) && workflowIds.includes(workflow.id)) {
          return true;
        }
      }
      
      return false;
    });
  }, [searchQuery, allWorkflows]);

  const getWorkflowStats = (workflowId: string) => {
    // Mock stats for now - in real app this would come from analytics
    const mockStats = {
      'loop-over-rows': { runs: 1247, rating: 4.8 },
      'crawl4logo': { runs: 892, rating: 4.6 },
      'crawl4contacts': { runs: 634, rating: 4.7 },
      'co-storm-blog-gen': { runs: 423, rating: 4.5 },
      'check-ai-mentions': { runs: 156, rating: 4.3 },
      'crawl4imprint': { runs: 89, rating: 4.2 },
      'transform-image': { runs: 67, rating: 4.4 }
    };
    
    return mockStats[workflowId] || { runs: Math.floor(Math.random() * 100) + 10, rating: 4.0 + Math.random() * 0.8 };
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Find AI Workflows</h1>
          <p className="text-gray-600">Discover reliable workflows built by developers</p>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>12,647 workflows run today</span>
            </div>
            <div className="flex items-center gap-1">
              <span>★ 4.7 average rating</span>
            </div>
            <div className="flex items-center gap-1">
              <span>2,000+ developers</span>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search workflows... (e.g., 'analyze CSV data', 'extract company logos', 'process customer feedback')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-base border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 rounded-lg"
            />
          </div>
          
          {searchQuery && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Found {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
              <p className="text-gray-500">Try searching for "CSV analysis", "logo extraction", or "contact finder"</p>
            </div>
          ) : (
            filteredWorkflows.map((workflow) => {
              const stats = getWorkflowStats(workflow.id);
              return (
                <Link
                  key={workflow.id}
                  to={`/flows/${workflow.id}`}
                  className="block border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <workflow.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{workflow.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {stats.runs.toLocaleString()} runs
                            </span>
                            <span>★ {stats.rating.toFixed(1)}</span>
                            {workflow.visualExplanation?.estimatedTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {workflow.visualExplanation.estimatedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                        {workflow.visualExplanation?.overview || workflow.description}
                      </p>
                      
                      {workflow.visualExplanation?.useCases && (
                        <div className="flex flex-wrap gap-2">
                          {workflow.visualExplanation.useCases.slice(0, 3).map((useCase, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {useCase}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          setDemoWorkflow(workflow);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Play className="h-3 w-3" />
                        Try Demo
                      </Button>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Recent Activity & Popular Searches */}
        {!searchQuery && (
          <div className="mt-12 border-t border-gray-100 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {[
                    { user: 'Sarah M.', action: 'processed 250 companies', workflow: 'Loop Over Rows', time: '2 minutes ago' },
                    { user: 'Tech Startup', action: 'extracted logos from 50 websites', workflow: 'Crawl4Logo', time: '8 minutes ago' },
                    { user: 'Marketing Team', action: 'generated blog content', workflow: 'Co-Storm Blog Gen', time: '15 minutes ago' },
                    { user: 'John D.', action: 'found 30 contact emails', workflow: 'Crawl4Contacts', time: '23 minutes ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">
                        <strong>{activity.user}</strong> {activity.action} using{' '}
                        <span className="text-gray-900 font-medium">{activity.workflow}</span>
                      </span>
                      <span className="text-gray-500 text-xs ml-auto">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Searches */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Searches</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    'CSV data analysis',
                    'Company logo extraction', 
                    'Contact information',
                    'Content generation',
                    'Image processing',
                    'Lead scoring'
                  ].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Modal */}
        {demoWorkflow && (
          <WorkflowDemo
            workflow={demoWorkflow}
            isOpen={!!demoWorkflow}
            onClose={() => setDemoWorkflow(null)}
            onGoToWorkflow={() => {
              navigate(`/flows/${demoWorkflow.id}`);
              setDemoWorkflow(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Search; 