import React, { useState, useMemo } from 'react';
import { getAllWorkflows } from '@/config/workflows';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppCard from '@/components/AppCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ListFilter, Search as SearchIcon, Send } from 'lucide-react';

type SortOption = 'popularity' | 'newest';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('popularity');
  const allWorkflows = getAllWorkflows();

  const getWorkflowStats = (workflowId: string) => {
    // Mock stats for now
    const mockStats = {
      'loop-over-rows': { runs: 1247, rating: 4.8, createdAt: new Date('2025-07-20') },
      'crawl4imprint': { runs: 892, rating: 4.6, createdAt: new Date('2025-07-18') },
      // Add more mock data as needed
    };
    return mockStats[workflowId] || { runs: Math.floor(Math.random() * 100), rating: 4.0, createdAt: new Date() };
  };

  const filteredAndSortedWorkflows = useMemo(() => {
    let workflows = allWorkflows;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      workflows = workflows.filter(workflow =>
        workflow.title.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query)
      );
    }

    if (sortOption === 'popularity') {
      workflows.sort((a, b) => {
        const statsA = getWorkflowStats(a.id);
        const statsB = getWorkflowStats(b.id);
        return statsB.runs - statsA.runs;
      });
    } else if (sortOption === 'newest') {
      workflows.sort((a, b) => {
        const statsA = getWorkflowStats(a.id);
        const statsB = getWorkflowStats(b.id);
        return statsB.createdAt.getTime() - statsA.createdAt.getTime();
      });
    }

    return workflows;
  }, [searchQuery, sortOption, allWorkflows]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            App Library
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover powerful, pre-built workflows to automate your tasks. Search for an app or browse by category.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for an app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-14 py-3 h-12 text-base rounded-lg w-full"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                disabled={!searchQuery}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 flex-shrink-0">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Sort by: {sortOption === 'popularity' ? 'Popularity' : 'Newest'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption('popularity')}>
                    Popularity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('newest')}>
                    Newest
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Workflow Grid */}
        {filteredAndSortedWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedWorkflows.map((workflow) => {
                const stats = getWorkflowStats(workflow.id);
                const isLive = workflow.status === 'live';

                return (
                  <AppCard
                    key={workflow.id}
                    title={workflow.title}
                    category={workflow.category || "General"}
                    description={workflow.description}
                    likes={stats.runs.toString()}
                    views={Math.round(stats.runs * 3.5).toString()}
                  />
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