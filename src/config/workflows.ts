import { WorkflowConfig } from '@/components/WorkflowBase';
import { 
  BarChart3, 
  Globe, 
  Users, 
  FileText, 
  MessageSquare, 
  Palette, 
  Search,
  Image,
  Link,
  PenTool
} from 'lucide-react';

// Workflow Registry - Add new workflows here
export const workflows: Record<string, WorkflowConfig> = {
  'loop-over-rows': {
    id: 'loop-over-rows',
    title: 'Loop Over Rows',
    description: 'AI batch processing for CSV data with intelligent analysis',
    icon: BarChart3,
    color: 'blue',
    status: 'live',
    category: 'Data Processing',
    
    inputs: [
      {
        id: 'csv_data',
        label: 'CSV Data',
        type: 'csv',
        placeholder: 'Name,Email,Company\nJohn Doe,john@example.com,Tech Corp',
        required: true,
        helpText: 'Include headers in the first row'
      },
      {
        id: 'prompt',
        label: 'AI Processing Instructions',
        type: 'textarea',
        placeholder: 'Tell the AI what you want to learn about each row...',
        required: true,
        helpText: 'The AI will analyze each row according to your instructions'
      }
    ],
    
    templates: [
      {
        id: 'lead-scoring',
        title: 'Lead Scoring',
        description: 'Score and analyze sales leads',
        prompt: 'Analyze each lead and provide: Lead Score (1-10), Company Size, Industry, and Likelihood to convert (High/Medium/Low).',
        sampleData: {
          csv_data: `Name,Email,Company,Website
John Smith,john@techcorp.com,TechCorp Inc,techcorp.com
Sarah Johnson,sarah@innovate.io,Innovate Solutions,innovate.io
Mike Chen,mike@startupxyz.com,StartupXYZ,startupxyz.com`
        }
      },
      {
        id: 'content-analysis',
        title: 'Content Analysis',
        description: 'Categorize and analyze content',
        prompt: 'Analyze each content piece and provide: Category, Target Audience, Quality Score (1-10), and Key insights.'
      },
      {
        id: 'customer-feedback',
        title: 'Customer Feedback',
        description: 'Analyze customer reviews and feedback',
        prompt: 'Analyze each feedback and provide: Sentiment (Positive/Negative/Neutral), Key Issues, and Recommendations.'
      }
    ],
    
    endpoint: 'https://scaile--loop-over-rows-fastapi-app.modal.run/process',
    supportsGoogleSearch: true,
    supportsTestMode: true,

    // Modes metadata (frontend only)
    // default mode is freestyle; keyword-kombat is a preset mode
    // Temporary per-mode endpoint override until backend is unified
    modes: [
      { id: 'freestyle', label: 'Freestyle' },
      { id: 'keyword-kombat', label: 'Keyword Kombat' },
      { id: 'vc-analyst', label: 'VC Analyst' }
    ],
    defaultModeId: 'freestyle',
    
    estimatedTime: {
      base: 15,
      perItem: 5,
      withSearch: 8
    },
    
    outputType: 'table',
    downloadable: true,
    
    visualExplanation: {
      title: 'How Loop Over Rows Works',
      overview: 'Process each row of your CSV data with custom AI prompts. Perfect for analyzing large datasets, qualifying leads, or extracting insights from structured data.',
      estimatedTime: '2-10 minutes',
      complexity: 'easy',
      steps: [
        {
          step: 1,
          title: 'Upload CSV Data',
          description: 'Upload your CSV file with the data you want to process',
          icon: 'upload',
          type: 'input',
          example: 'company_list.csv with columns: company_name, website, industry',
          details: 'Supports CSV files up to 25MB with any number of columns and rows'
        },
        {
          step: 2,
          title: 'Define AI Prompt',
          description: 'Tell the AI exactly what analysis to perform on each row',
          icon: 'settings',
          type: 'config',
          example: '"Analyze this company\'s website and determine their primary business focus and target market"',
          details: 'Be specific about what you want the AI to extract or analyze from each data row'
        },
        {
          step: 3,
          title: 'AI Processing',
          description: 'Our AI processes each row individually using advanced language models',
          icon: 'cpu',
          type: 'processing',
          example: 'Row 1: Apple Inc. → "Consumer electronics and software, targeting mainstream consumers"',
          details: 'Processing time: ~5-10 seconds per row depending on complexity'
        },
        {
          step: 4,
          title: 'Enhanced Results',
          description: 'Download your original data enriched with AI-generated insights',
          icon: 'download',
          type: 'output',
          example: 'Original CSV + new columns: AI_Analysis, Confidence_Score, Processing_Time',
          details: 'Results available as CSV download or viewable in interactive table'
        }
      ],
      useCases: [
        'Lead qualification from company databases',
        'Product categorization and analysis',
        'Customer sentiment analysis from reviews',
        'Market research data enrichment',
        'Content analysis and classification',
        'Competitive intelligence gathering'
      ],
      tips: [
        'Be specific in your AI prompts for better results',
        'Start with a small sample to test your prompt',
        'Larger files take longer but process more efficiently',
        'Include clear column headers in your CSV',
        'Consider breaking very large datasets into chunks'
      ]
    }
  },

  'crawl4logo': {
    id: 'crawl4logo',
    title: 'Crawl4Logo',
    description: 'Extract and download company logos from websites automatically',
    icon: Image,
    color: 'purple',
    status: 'live', // Deployed to frontand-app workspace with FastAPI app
    category: 'Data Enrichment',
    
    inputs: [
      {
        id: 'urls',
        label: 'Website URLs',
        type: 'textarea',
        placeholder: 'https://example.com\nhttps://company.com\nhttps://startup.io',
        required: true,
        helpText: 'Enter one URL per line'
      },
      {
        id: 'format',
        label: 'Output Format',
        type: 'select',
        options: [
          { id: 'png', label: 'PNG (Recommended)', value: 'png' },
          { id: 'jpg', label: 'JPG', value: 'jpg' },
          { id: 'svg', label: 'SVG (Vector)', value: 'svg' }
        ],
        required: true
      },
      {
        id: 'size',
        label: 'Image Size',
        type: 'select',
        options: [
          { id: 'original', label: 'Original Size', value: 'original' },
          { id: '256', label: '256x256px', value: '256' },
          { id: '512', label: '512x512px', value: '512' },
          { id: '1024', label: '1024x1024px', value: '1024' }
        ]
      }
    ],
    
    templates: [
      {
        id: 'tech-companies',
        title: 'Tech Companies',
        description: 'Sample tech company websites',
        sampleData: {
          urls: 'https://stripe.com\nhttps://vercel.com\nhttps://openai.com',
          format: 'png',
          size: '512'
        }
      }
    ],
    
    endpoint: 'https://frontand-app--tech-crawl4logo-fastapi-app.modal.run/process',
    supportsGoogleSearch: false,
    supportsTestMode: true,
    
    estimatedTime: {
      base: 10,
      perItem: 8
    },
    
    outputType: 'table',
    downloadable: true
  },

  'crawl4contacts': {
    id: 'crawl4contacts',
    title: 'Crawl4Contacts',
    description: 'Extract contact information and team members from company websites',
    icon: Users,
    color: 'green',
    status: 'live', // Deployed to frontand-app workspace with FastAPI wrapper
    category: 'Sales & Marketing',
    
    inputs: [
      {
        id: 'companies',
        label: 'Company Websites or Names',
        type: 'textarea',
        placeholder: 'TechCorp Inc\nhttps://innovate.io\nStartupXYZ',
        required: true,
        helpText: 'Enter company names or website URLs, one per line'
      },
      {
        id: 'contact_types',
        label: 'Contact Types to Find',
        type: 'multiselect',
        options: [
          { id: 'executives', label: 'Executives (CEO, CTO, etc.)', value: 'executives' },
          { id: 'sales', label: 'Sales Team', value: 'sales' },
          { id: 'marketing', label: 'Marketing Team', value: 'marketing' },
          { id: 'support', label: 'Customer Support', value: 'support' },
          { id: 'general', label: 'General Contact Info', value: 'general' }
        ],
        required: true
      }
    ],
    
    templates: [
      {
        id: 'sales-outreach',
        title: 'Sales Outreach',
        description: 'Find decision makers for sales',
        sampleData: {
          companies: 'TechCorp Inc\nInnovate Solutions\nStartupXYZ',
          contact_types: ['executives', 'sales']
        }
      }
    ],
    
    endpoint: 'https://frontand-app--tech-crawl4contacts-frontand-wrapper-fastapi-app.modal.run/process',
    supportsGoogleSearch: true,
    supportsTestMode: true,
    
    estimatedTime: {
      base: 20,
      perItem: 15,
      withSearch: 10
    },
    
    outputType: 'table',
    downloadable: true
  },

  'co-storm-blog-gen': {
    id: 'co-storm-blog-gen',
    title: 'Co-Storm Blog Gen',
    description: 'Generate comprehensive blog posts with AI collaboration and research',
    icon: PenTool,
    color: 'indigo',
    status: 'coming-soon',
    category: 'Content Generation',
    
    inputs: [
      {
        id: 'topic',
        label: 'Blog Topic',
        type: 'text',
        placeholder: 'The Future of AI in Marketing',
        required: true
      },
      {
        id: 'keywords',
        label: 'Target Keywords',
        type: 'text',
        placeholder: 'AI marketing, automation, personalization',
        helpText: 'Comma-separated keywords for SEO optimization'
      },
      {
        id: 'tone',
        label: 'Writing Tone',
        type: 'select',
        options: [
          { id: 'professional', label: 'Professional', value: 'professional' },
          { id: 'casual', label: 'Casual & Friendly', value: 'casual' },
          { id: 'technical', label: 'Technical & Detailed', value: 'technical' },
          { id: 'persuasive', label: 'Persuasive', value: 'persuasive' }
        ]
      },
      {
        id: 'length',
        label: 'Article Length',
        type: 'select',
        options: [
          { id: 'short', label: 'Short (800-1200 words)', value: 'short' },
          { id: 'medium', label: 'Medium (1200-2000 words)', value: 'medium' },
          { id: 'long', label: 'Long (2000+ words)', value: 'long' }
        ]
      }
    ],
    
    templates: [
      {
        id: 'tech-blog',
        title: 'Tech Blog Post',
        description: 'Technology-focused article',
        sampleData: {
          topic: 'The Future of AI in Software Development',
          keywords: 'AI development, coding automation, developer tools',
          tone: 'technical',
          length: 'medium'
        }
      }
    ],
    
    endpoint: 'https://scaile--co-storm-blog-gen-fastapi-app.modal.run/process',
    supportsGoogleSearch: true,
    supportsTestMode: false,
    
    estimatedTime: {
      base: 45,
      withSearch: 20
    },
    
    outputType: 'text',
    downloadable: true
  },

  'check-ai-mentions': {
    id: 'check-ai-mentions',
    title: 'Check AI Mentions',
    description: 'Monitor and analyze mentions of your brand, products, or keywords across the web',
    icon: Search,
    color: 'yellow',
    status: 'coming-soon',
    category: 'Monitoring',
    
    inputs: [
      {
        id: 'keywords',
        label: 'Keywords to Monitor',
        type: 'textarea',
        placeholder: 'Your Brand Name\nYour Product\nCompetitor Name',
        required: true,
        helpText: 'Enter keywords or phrases to search for, one per line'
      },
      {
        id: 'sources',
        label: 'Sources to Check',
        type: 'multiselect',
        options: [
          { id: 'news', label: 'News Sites', value: 'news' },
          { id: 'blogs', label: 'Blogs & Articles', value: 'blogs' },
          { id: 'forums', label: 'Forums & Communities', value: 'forums' },
          { id: 'social', label: 'Social Media', value: 'social' },
          { id: 'reviews', label: 'Review Sites', value: 'reviews' }
        ],
        required: true
      },
      {
        id: 'timeframe',
        label: 'Time Period',
        type: 'select',
        options: [
          { id: '24h', label: 'Last 24 hours', value: '24h' },
          { id: '7d', label: 'Last 7 days', value: '7d' },
          { id: '30d', label: 'Last 30 days', value: '30d' },
          { id: '90d', label: 'Last 3 months', value: '90d' }
        ]
      }
    ],
    
    templates: [
      {
        id: 'brand-monitoring',
        title: 'Brand Monitoring',
        description: 'Monitor brand mentions and sentiment',
        sampleData: {
          keywords: 'Your Brand\nYour Product\nCEO Name',
          sources: ['news', 'blogs', 'social'],
          timeframe: '7d'
        }
      }
    ],
    
    endpoint: 'https://scaile--check-ai-mentions-fastapi-app.modal.run/process',
    supportsGoogleSearch: true,
    supportsTestMode: true,
    
    estimatedTime: {
      base: 25,
      perItem: 10,
      withSearch: 5
    },
    
    outputType: 'table',
    downloadable: true
  },

  'crawl4imprint': {
    id: 'crawl4imprint',
    title: 'Crawl4Imprint',
    description: 'AI-powered imprint extraction with 85.9% success rate - extracts company names, addresses, managing directors, registration details',
    icon: FileText,
    color: 'gray',
    status: 'live',
    category: 'Legal & Compliance',
    
    inputs: [
      {
        id: 'websites',
        label: 'Website URLs',
        type: 'csv',
        placeholder: 'https://stripe.com\nhttps://vercel.com\nhttps://openai.com',
        required: true,
        helpText: 'Enter website URLs to extract imprint information from, one per line, or upload a CSV file'
      }
    ],
    
    templates: [
      {
        id: 'startup-imprints',
        title: 'Startup Companies',
        description: 'Extract imprint data from tech startups',
        sampleData: {
          websites: 'https://stripe.com\nhttps://vercel.com'
        }
      },
      {
        id: 'german-companies',
        title: 'German Companies',
        description: 'Extract Impressum data from German websites',
        sampleData: {
          websites: 'https://sap.com\nhttps://siemens.com'
        }
      }
    ],
    
    endpoint: 'https://scaile--imprint-reader-frontand-fastapi-app.modal.run/process',
    supportsGoogleSearch: false,
    supportsTestMode: true,
    
    estimatedTime: {
      base: 15,
      perItem: 12
    },
    
    outputType: 'table',
    downloadable: true
  },

  'transform-image': {
    id: 'transform-image',
    title: 'Transform Image',
    description: 'Transform images with AI - change colors, styles, formats, and more',
    icon: Palette,
    color: 'pink',
    status: 'coming-soon',
    category: 'Image Processing',
    
    inputs: [
      {
        id: 'image',
        label: 'Source Image',
        type: 'image',
        accept: 'image/*',
        required: true,
        helpText: 'Upload JPG, PNG, or other image formats'
      },
      {
        id: 'transformation',
        label: 'Transformation Type',
        type: 'select',
        options: [
          { id: 'color-change', label: 'Change Colors', value: 'color-change' },
          { id: 'style-transfer', label: 'Style Transfer', value: 'style-transfer' },
          { id: 'background-remove', label: 'Remove Background', value: 'background-remove' },
          { id: 'upscale', label: 'Upscale/Enhance', value: 'upscale' },
          { id: 'format-convert', label: 'Format Conversion', value: 'format-convert' }
        ],
        required: true
      },
      {
        id: 'target_color',
        label: 'Target Color (for color changes)',
        type: 'text',
        placeholder: 'blue, red, #FF5733, etc.',
        helpText: 'Specify color name or hex code'
      },
      {
        id: 'output_format',
        label: 'Output Format',
        type: 'select',
        options: [
          { id: 'png', label: 'PNG', value: 'png' },
          { id: 'jpg', label: 'JPG', value: 'jpg' },
          { id: 'webp', label: 'WebP', value: 'webp' },
          { id: 'svg', label: 'SVG (when possible)', value: 'svg' }
        ]
      }
    ],
    
    templates: [
      {
        id: 'logo-recolor',
        title: 'Logo Recoloring',
        description: 'Change logo colors',
        sampleData: {
          transformation: 'color-change',
          target_color: 'blue',
          output_format: 'png'
        }
      }
    ],
    
    endpoint: 'https://scaile--transform-image-fastapi-app.modal.run/process',
    supportsGoogleSearch: false,
    supportsTestMode: false,
    
    estimatedTime: {
      base: 20
    },
    
    outputType: 'image',
    downloadable: true
  },

  'crawl4gmaps': {
    id: 'crawl4gmaps',
    title: 'Crawl4GMaps',
    description: 'Extract business information from Google Maps searches by location and search terms',
    icon: Search,
    color: 'emerald',
    status: 'live', // Deployed to frontand-app workspace with FastAPI wrapper
    category: 'Data Enrichment',
    
    inputs: [
      {
        id: 'locations',
        label: 'Locations',
        type: 'textarea',
        placeholder: 'New York, NY\nLos Angeles, CA\nChicago, IL',
        required: true,
        helpText: 'Enter locations to search, one per line'
      },
      {
        id: 'search_terms',
        label: 'Search Terms',
        type: 'textarea',
        placeholder: 'restaurants\ncoffee shops\ngyms',
        required: true,
        helpText: 'Enter what businesses to search for, one per line'
      },
      {
        id: 'max_results',
        label: 'Max Results per Search',
        type: 'number',
        placeholder: '10',
        helpText: 'Maximum number of results to return per location/search term combination'
      }
    ],
    
    templates: [
      {
        id: 'restaurant-research',
        title: 'Restaurant Research',
        description: 'Find restaurants in major cities',
        sampleData: {
          locations: 'New York, NY\nLos Angeles, CA',
          search_terms: 'restaurants\nitalian restaurants',
          max_results: 10
        }
      },
      {
        id: 'competitor-analysis',
        title: 'Competitor Analysis',
        description: 'Find competitors in specific markets',
        sampleData: {
          locations: 'San Francisco, CA\nSeattle, WA',
          search_terms: 'coworking spaces\ntech startups',
          max_results: 15
        }
      }
    ],
    
    endpoint: 'https://frontand-app--tech-gmaps-frontand-wrapper-fastapi-app.modal.run/process',
    supportsGoogleSearch: false,
    supportsTestMode: true,
    
    estimatedTime: {
      base: 30,
      perItem: 20
    },
    
    outputType: 'table',
    downloadable: true
  },

  // keyword-kombat removed as standalone workflow; available as a mode under loop-over-rows
};

// Helper function to get workflow by ID
export const getWorkflow = (id: string): WorkflowConfig | undefined => {
  return workflows[id];
};

// Helper function to get all workflows
export const getAllWorkflows = (): WorkflowConfig[] => {
  return Object.values(workflows);
};

// Helper function to get workflows by category/status
export const getWorkflowsByStatus = (live: boolean = true): WorkflowConfig[] => {
  return Object.values(workflows).filter(workflow => 
    live ? workflow.status === 'live' : workflow.status === 'coming-soon'
  );
}; 