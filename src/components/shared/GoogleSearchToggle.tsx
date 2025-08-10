import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';

interface GoogleSearchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  descriptionKeywordMode?: string;
  descriptionDefault?: string;
  isKeywordMode?: boolean;
}

const GoogleSearchToggle: React.FC<GoogleSearchToggleProps> = ({
  checked,
  onChange,
  descriptionKeywordMode = 'Enhanced company research',
  descriptionDefault = 'Optional web enrichment',
  isKeywordMode,
}) => {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
      <span className="font-medium text-foreground">Google Search</span>
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {isKeywordMode ? descriptionKeywordMode : descriptionDefault}
        </span>
      </div>
    </div>
  );
};

export default GoogleSearchToggle;

