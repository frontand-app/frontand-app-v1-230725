
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Sparkles, 
  Clock,
  PlayCircle,
  Globe,
  Database,
  Target,
  Workflow
} from "lucide-react";
import { getAllWorkflows, getWorkflowsByStatus } from "@/config/workflows";

const Index = () => {
  const liveWorkflows = getWorkflowsByStatus(true);
  const comingWorkflows = getWorkflowsByStatus(false);
  const allWorkflows = [...liveWorkflows, ...comingWorkflows.slice(0, 3)]; // Show max 4 total

  const stats = [
    { value: `${getAllWorkflows().length}`, label: "Workflows", icon: Workflow },
    { value: "50+", label: "Cloud Apps", icon: Globe },
    { value: "10K+", label: "Rows Processed", icon: Database },
    { value: "99.9%", label: "Uptime", icon: Target }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm mb-8">
            <Sparkles className="w-3 h-3" />
            <span>Front& - Universal Cloud App Frontend</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-tight">
            One frontend,<br />
            infinite cloud apps
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg lg:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect any data source to any cloud app with AI-powered workflows. 
            Start with Loop Over Rows, scale to everything.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-base"
              asChild
            >
              <Link to="/flows/loop-over-rows">
                <PlayCircle className="mr-2 w-4 h-4" />
                Try Loop Over Rows
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4 text-gray-500" />
                  <div className="text-xl font-semibold text-gray-900">{stat.value}</div>
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-3">
              Available Workflows
            </h2>
            <p className="text-base text-gray-600">
              Start with our first workflow, more AI-powered workflows coming soon
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allWorkflows.map((workflow) => {
              const isLive = liveWorkflows.some(w => w.id === workflow.id);

              return (
                <Card key={workflow.id} className={`border border-gray-200 ${isLive ? 'hover:border-gray-300' : 'opacity-75'} transition-all duration-200`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <workflow.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">
                            {workflow.title}
                          </CardTitle>
                          <div className="text-xs text-gray-500 mt-1">
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
                    
                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workflow.templates?.slice(0, 3).map((template, templateIndex) => (
                        <span key={templateIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {template.title}
                        </span>
                      ))}
                    </div>
                    
                    {isLive ? (
                      <Button 
                        asChild 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
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
                        className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
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
            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-3">
              How it works
            </h2>
            <p className="text-base text-gray-600">
              Three simple steps to connect your data to any cloud app
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium mx-auto mb-4">
                1
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Choose workflow</h3>
              <p className="text-sm text-gray-600">
                Select from our library of AI-powered workflows
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium mx-auto mb-4">
                2
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Add your data</h3>
              <p className="text-sm text-gray-600">
                Upload CSV files or connect your data sources
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium mx-auto mb-4">
                3
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">AI processes</h3>
              <p className="text-sm text-gray-600">
                Watch AI analyze and route your data intelligently
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-base text-gray-600 mb-8">
            Try our first workflow and see how AI can transform your data processing.
          </p>
          <Button 
            size="lg" 
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3"
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
