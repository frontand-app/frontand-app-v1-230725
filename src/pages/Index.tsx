
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Code, Gauge, Shield, Github, Star, Sparkles, Database, Upload, BarChart3 } from "lucide-react";

const Index = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Your Data",
      description: "Upload CSV files or connect to your data sources"
    },
    {
      icon: Sparkles,
      title: "AI Processing",
      description: "Our AI processes each row with your custom prompt"
    },
    {
      icon: BarChart3,
      title: "Get Results",
      description: "Download processed data or export to your cloud apps"
    }
  ];

  const cloudApps = [
    "Google Sheets", "Airtable", "Notion", "Slack", "Email", "Webhooks"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <Badge 
              variant="secondary" 
              className="mb-8 bg-primary-50 text-primary-700 border border-primary-200 px-4 py-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Front& V1 - Now Live
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              One frontend,
              <span className="text-primary-500 block">infinite cloud apps</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Process your data with AI and automatically send results to any cloud platform. 
              Start with our Loop Over Rows workflow - no coding required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 text-lg"
                asChild
              >
                <Link to="/flows/loop-over-rows">
                  Try Loop Over Rows <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg"
                asChild
              >
                <a href="https://github.com/frontand-app/frontand-app-v1-clean" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 w-5 h-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>

          {/* Demo Card */}
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="border border-gray-200 bg-white shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl text-gray-900 mb-2">
                  Loop Over Rows
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Process CSV data with AI and export to your favorite cloud apps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Example Use Cases:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>• Lead scoring and qualification</div>
                    <div>• Content categorization</div>
                    <div>• Sentiment analysis at scale</div>
                    <div>• Data enrichment and cleanup</div>
                    <div>• Automated quality checks</div>
                    <div>• Custom AI transformations</div>
                  </div>
                </div>
                <div className="text-center">
                  <Button asChild className="bg-primary-500 hover:bg-primary-600 text-white">
                    <Link to="/flows/loop-over-rows">
                      Start Processing Data
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to transform your data with AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cloud Apps Integration */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Connect to Any Cloud App
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Send your processed data anywhere with our growing list of integrations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {cloudApps.map((app, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="text-lg font-medium text-gray-900">{app}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-500 mb-6">
              Don't see your app? We support custom webhooks and API integrations.
            </p>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Request Integration
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Front&?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Lightning Fast
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Process thousands of rows in minutes with optimized AI models 
                and parallel processing.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Secure & Private
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your data is encrypted and processed securely. No storage, 
                just transformation and delivery.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Code className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No Code Required
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Simple interface, powerful results. Just upload, configure, 
                and let AI do the work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Connect Your Data?
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Start with Loop Over Rows and discover the power of AI-driven data processing
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 text-lg"
              asChild
            >
              <Link to="/flows/loop-over-rows">
                Start Now - It's Free
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg"
              asChild
            >
              <a href="https://github.com/frontand-app/frontand-app-v1-clean" target="_blank" rel="noopener noreferrer">
                View Source Code
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
