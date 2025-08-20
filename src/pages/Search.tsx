import React, { useState, useMemo } from 'react';
import { getAllWorkflows } from '@/config/workflows';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppCard from '@/components/AppCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ListFilter, Search as SearchIcon, Send, Filter, Star, Clock, DollarSign, TrendingUp } from 'lucide-react';

type SortOption = 'popularity' | 'newest' | 'executions' | 'cost' | 'speed';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('popularity');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const allWorkflows = getAllWorkflows();

  // Define categories based on actual workflow data
  const categories = [
    'all',
    'Data Extraction',
    'Content Generation', 
    'Business Intelligence',
    'Marketing',
    'Research'
  ];

  const getWorkflowStats = (workflowId: string) => {
    // Enhanced mock stats with more realistic data
    const mockStats = {
      'loop-over-rows': { runs: 1247, rating: 4.8, createdAt: new Date('2025-07-20'), avgCost: 0.05, avgTime: '2.3s' },
      'crawl4imprint': { runs: 892, rating: 4.6, createdAt: new Date('2025-07-18'), avgCost: 0.08, avgTime: '4.1s' },
      'crawl4contacts': { runs: 1856, rating: 4.9, createdAt: new Date('2025-07-22'), avgCost: 0.12, avgTime: '6.2s' },
      'crawl4gmaps': { runs: 743, rating: 4.7, createdAt: new Date('2025-07-19'), avgCost: 0.15, avgTime: '8.1s' },
      'crawl4logo': { runs: 534, rating: 4.5, createdAt: new Date('2025-07-21'), avgCost: 0.06, avgTime: '3.4s' },
    };
    return mockStats[workflowId] || { 
      runs: Math.floor(Math.random() * 500) + 50, 
      rating: 4.0 + Math.random() * 1.0, 
      createdAt: new Date(), 
      avgCost: 0.03 + Math.random() * 0.15,
      avgTime: `${(1 + Math.random() * 8).toFixed(1)}s`
    };
  };

  const filteredAndSortedWorkflows = useMemo(() => {
    let workflows = allWorkflows;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      workflows = workflows.filter(workflow =>
        workflow.title.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query) ||
        (workflow.category && workflow.category.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      workflows = workflows.filter(workflow => 
        workflow.category === categoryFilter
      );
    }

    // Sort workflows
    workflows.sort((a, b) => {
      const statsA = getWorkflowStats(a.id);
      const statsB = getWorkflowStats(b.id);
      
      switch (sortOption) {
        case 'popularity':
          return statsB.rating - statsA.rating;
        case 'executions':
          return statsB.runs - statsA.runs;
        case 'cost':
          return statsA.avgCost - statsB.avgCost;
        case 'speed':
          return parseFloat(statsA.avgTime) - parseFloat(statsB.avgTime);
        case 'newest':
          return statsB.createdAt.getTime() - statsA.createdAt.getTime();
        default:
          return 0;
      }
    });

    return workflows;
  }, [searchQuery, sortOption, categoryFilter, allWorkflows]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Search Workflows
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover powerful, pre-built workflows to automate your tasks. Search for an app or browse by category.
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search workflows, descriptions, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-full lg:w-48 h-12">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="executions">Most Used</SelectItem>
                <SelectItem value="cost">Lowest Cost</SelectItem>
                <SelectItem value="speed">Fastest</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredAndSortedWorkflows.length} of {allWorkflows.length} workflows
          </p>
        </div>

        {/* Enhanced Workflow Grid */}
        {filteredAndSortedWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedWorkflows.map((workflow) => {
                const stats = getWorkflowStats(workflow.id);
                const isLive = workflow.status === 'live';

                return (
                  <Card key={workflow.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-border/50 hover:border-border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {workflow.category || "General"}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {stats.rating.toFixed(1)}
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors text-lg leading-tight">
                        {workflow.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {workflow.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center text-muted-foreground">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            <span>{stats.runs.toLocaleString()} runs</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{stats.avgTime}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <DollarSign className="w-3 h-3 mr-1" />
                            <span>${stats.avgCost.toFixed(3)}</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-xs text-muted-foreground">
                              {isLive ? 'Active' : 'Coming Soon'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="pt-2">
                          <Button 
                            className={`w-full ${isLive ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                            disabled={!isLive}
                            onClick={() => window.location.href = `/search/${workflow.id}`}
                          >
                            {isLive ? 'Run Workflow' : 'Coming Soon'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-2">No Apps Found</h3>
            <p className="text-muted-foreground">
              Your search for "{searchQuery}" did not match any apps. Try a different search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search; 