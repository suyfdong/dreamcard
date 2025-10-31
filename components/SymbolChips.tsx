"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SymbolChipsProps {
  symbols: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function SymbolChips({ symbols, selected, onChange }: SymbolChipsProps) {
  const toggleSymbol = (symbol: string) => {
    if (selected.includes(symbol)) {
      onChange(selected.filter((s) => s !== symbol));
    } else {
      onChange([...selected, symbol]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {symbols.map((symbol) => {
        const isSelected = selected.includes(symbol);
        return (
          <Badge
            key={symbol}
            variant="outline"
            className={cn(
              "cursor-pointer px-4 py-2 text-sm transition-all duration-300 hover:scale-110",
              isSelected
                ? "scale-105 border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-400/20 to-teal-400/15 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/30 hover:bg-emerald-400/25 font-semibold"
                : "hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20"
            )}
            onClick={() => toggleSymbol(symbol)}
          >
            {symbol}
          </Badge>
        );
      })}
    </div>
  );
}
