import { useState, useRef, useEffect } from 'react';
import { Search, X, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchInput = ({ value, onChange, placeholder = "Search anime...", autoFocus }: SearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div 
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border transition-all duration-300",
        isFocused 
          ? "border-primary shadow-lg shadow-primary/10" 
          : "border-transparent hover:border-border"
      )}
    >
      <Search className={cn(
        "w-5 h-5 transition-colors",
        isFocused ? "text-primary" : "text-muted-foreground"
      )} />
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <button className="p-2 rounded-full hover:bg-muted transition-colors">
        <Mic className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default SearchInput;
