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
          <Link to={`/search/${getAppSlug(title)}`}>
             <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-border rounded-2xl overflow-hidden bg-background">
        <CardContent className="p-6">
          <div className="mb-4">
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              {category}
            </span>
          </div>
          
          <h3 className="text-base font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
            {description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{likes}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{views}</span>
              </div>
            </div>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AppCard;