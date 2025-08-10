import React from 'react';

interface ColumnSelectorChipsProps {
  headers: string[];
  selected: string[];
  onToggle: (header: string, nextSelected: string[]) => void;
}

const ColumnSelectorChips: React.FC<ColumnSelectorChipsProps> = ({ headers, selected, onToggle }) => {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Columns to include</label>
      <div className="flex flex-wrap gap-2">
        {headers.map((h) => {
          const isChecked = selected.includes(h);
          const className = `px-3 py-1.5 text-xs rounded-full border ${isChecked ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'}`;
          return (
            <button
              type="button"
              key={h}
              className={className}
              onClick={() => {
                const next = isChecked ? selected.filter(x => x !== h) : [...selected, h];
                onToggle(h, next);
              }}
            >
              {h}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColumnSelectorChips;

