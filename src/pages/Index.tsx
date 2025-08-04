
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Clock,
  PlayCircle
} from "lucide-react";
import { getWorkflowsByStatus } from "@/config/workflows";
import AppCard from "@/components/AppCard";

const Index = () => {
  const liveWorkflows = getWorkflowsByStatus(true);
  const comingWorkflows = getWorkflowsByStatus(false);
  const allWorkflows = [...liveWorkflows, ...comingWorkflows.slice(0, 3)]; // Show max 4 total

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-8 text-center">
        <div className="mb-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 mb-6">
            <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-foreground">
              Universal Cloud App Frontend
            </span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            1 FRONTEND.
            <br />
            <span className="inline-flex items-center gap-2">
              <span className="text-6xl md:text-7xl">∞</span>
              CLOUD APPS.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            CONNECT ANY DATA SOURCE TO ANY CLOUD APP
            <br />
            WITH AI-POWERED WORKFLOWS.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link to="/search">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-sm font-medium">
                DISCOVER ALL WORKFLOWS
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8 py-6 text-sm font-medium"
              asChild
            >
              <Link to="/flows/loop-over-rows">
                TRY FOR FREE
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hottest Apps Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-4">
        <div className="bg-card rounded-3xl border border-border p-6 shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 rounded-full px-4 py-2 text-sm font-medium">
              <span className="text-orange-600">🔥</span>
              Hottest Apps
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AppCard
              title="LOOP OVER ROWS"
              category="Lead Scoring, Content Analysis"
              description="AI batch processing for CSV data with intelligent analysis"
              likes="4K"
              views="16K"
            />
            <AppCard
              title="CRAWL4LOGO"
              category="Tech Companies"
              description="Extract and download company logos from websites automatically"
              likes="4K"
              views="16K"
            />
            <AppCard
              title="CRAWL4CONTACTS"
              category="Sales Outreach"
              description="Extract contact information and team members from company websites"
              likes="2.3K"
              views="8K"
            />
            <AppCard
              title="CO-STORM BLOG GEN"
              category="Tech Blog Post"
              description="Generate comprehensive blog posts with AI collaboration and research"
              likes="11K"
              views="32K"
            />
          </div>
        </div>
      </section>

      {/* Workflows Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-3">
              Available Workflows
            </h2>
            <p className="text-base text-muted-foreground">
              Start with our first workflow, more AI-powered workflows coming soon
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allWorkflows.map((workflow) => {
              const isLive = liveWorkflows.some(w => w.id === workflow.id);

              return (
                <Card key={workflow.id} className={`border ${isLive ? 'hover:shadow-md' : 'opacity-75'} transition-all duration-200`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-lg">
                          <workflow.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-foreground">
                            {workflow.title}
                          </CardTitle>
                          <div className="text-xs text-muted-foreground mt-1">
                            {isLive ? (
                              <span className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Live
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Coming Soon
                              </span>
                            )}
                          </div>
                        </div>
                </div>
              </div>
                    
                    <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workflow.templates?.slice(0, 3).map((template, templateIndex) => (
                        <span key={templateIndex} className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">
                          {template.title}
                        </span>
            ))}
          </div>

                    {isLive ? (
                      <Button 
                        asChild 
                        className="w-full bg-foreground hover:bg-foreground/90 text-background"
                        size="sm"
                      >
                        <Link to={`/flows/${workflow.id}`}>
                          <PlayCircle className="mr-2 w-4 h-4" />
                          Try Now
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        disabled 
                        className="w-full bg-secondary text-muted-foreground cursor-not-allowed"
                        size="sm"
                      >
                        <Clock className="mr-2 w-4 h-4" />
                        Coming Soon
            </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-3">
              How it works
            </h2>
            <p className="text-base text-muted-foreground">
              Three simple steps to connect your data to any cloud app
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium mx-auto mb-4">
                1
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">Choose workflow</h3>
              <p className="text-sm text-muted-foreground">
                Select from our library of AI-powered workflows
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium mx-auto mb-4">
                2
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">Add your data</h3>
              <p className="text-sm text-muted-foreground">
                Upload CSV files or connect your data sources
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium mx-auto mb-4">
                3
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">AI processes</h3>
              <p className="text-sm text-muted-foreground">
                Watch AI analyze and route your data intelligently
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-base text-muted-foreground mb-8">
            Try our first workflow and see how AI can transform your data processing.
          </p>
            <Button 
              size="lg" 
            className="bg-foreground hover:bg-foreground/90 text-background px-8 py-3"
              asChild
            >
              <Link to="/flows/loop-over-rows">
              <PlayCircle className="mr-2 w-4 h-4" />
              Start with Loop Over Rows
              <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
