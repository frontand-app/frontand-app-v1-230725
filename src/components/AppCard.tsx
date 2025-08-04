import { Card, CardContent } from "@/components/ui/card";
import { Heart, Eye, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface AppCardProps {
  title: string;
  category: string;
  description: string;
  likes: string;
  views: string;
}

const AppCard = ({ title, category, description, likes, views }: AppCardProps) => {
  const getAppSlug = (title: string) => {
    // Map specific titles to actual workflow routes
    const titleMap: { [key: string]: string } = {
      'LOOP OVER ROWS': 'loop-over-rows',
      'CRAWL4LOGO': 'crawl4imprint', // Map to existing crawl4imprint workflow
      'CRAWL4CONTACTS': 'crawl4imprint', // Also map to crawl4imprint for now
      'CO-STORM BLOG GEN': 'loop-over-rows', // Map to loop-over-rows for now
    };
    
    return titleMap[title] || title.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <Link to={`/flows/${getAppSlug(title)}`}>
      <Card className="group cursor-pointer hover:shadow-md transition-all duration-300 border border-border rounded-xl overflow-hidden bg-card">
        <CardContent className="p-4">
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
              {category}
            </span>
          </div>
          
          <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
            {description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{views}</span>
              </div>
            </div>
            
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AppCard;