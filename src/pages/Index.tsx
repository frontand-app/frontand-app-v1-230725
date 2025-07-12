
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Code, Gauge, Shield, Github, Star } from "lucide-react";

const Index = () => {
  const featuredFlows = [
    {
      id: "cluster-keywords",
      name: "Cluster Keywords",
      description: "Automatically group and categorize keywords using AI clustering algorithms",
      category: "Text Analysis",
      estimatedCost: "$0.05",
      popularity: 4.8
    },
    {
      id: "sentiment-analysis",
      name: "Sentiment Analysis",
      description: "Analyze text sentiment with detailed emotional breakdown and confidence scores",
      category: "NLP",
      estimatedCost: "$0.03",
      popularity: 4.9
    },
    {
      id: "image-to-text",
      name: "Image to Text",
      description: "Extract and analyze text from images with OCR and content understanding",
      category: "Vision",
      estimatedCost: "$0.08",
      popularity: 4.7
    }
  ];

  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Auto-Generated Forms",
      description: "Dynamic forms generated from JSON schemas. No manual form building required."
    },
    {
      icon: <Gauge className="w-6 h-6" />,
      title: "Real-time Cost Estimation",
      description: "See exact costs as you type. Never get surprised by AI model pricing again."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Multiple AI Models",
      description: "Choose from GPT-4, Claude, Gemini, and more. Compare prices and capabilities."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Open Source",
      description: "Fully open source. Self-host or contribute to the growing library of flows."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-700">
              <Github className="w-3 h-3 mr-1" />
              Open Source Task Automation
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              GitHub for
              <span className="text-blue-600 block">AI Workflows</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Run AI flows through auto-generated forms. Browse, customize, and execute 
              powerful AI workflows with real-time cost estimation and model selection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/flows">
                  Browse Flows
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/flows/cluster-keywords">
                  Try Demo Flow
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">150+</div>
                <div className="text-sm text-gray-600">AI Flows</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">50k+</div>
                <div className="text-sm text-gray-600">Executions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">10+</div>
                <div className="text-sm text-gray-600">AI Models</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CLOSED AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for developers who want powerful AI automation without the complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Flows */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Flows
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Popular AI workflows ready to use with just a few clicks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {featuredFlows.map((flow) => (
              <Card key={flow.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{flow.category}</Badge>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {flow.popularity}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-blue-600 transition-colors">
                    {flow.name}
                  </CardTitle>
                  <CardDescription>{flow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Est. cost: <span className="font-medium text-gray-900">{flow.estimatedCost}</span>
                    </span>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/flows/${flow.id}`}>
                        Try Now
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/flows">
                View All Flows
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Automate with AI?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers using CLOSED AI to streamline their workflows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
