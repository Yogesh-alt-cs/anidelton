import { cn } from '@/lib/utils';

interface GenreChipProps {
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const GenreChip = ({ name, isSelected, onClick, icon }: GenreChipProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
        isSelected
          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
      )}
    >
      {icon}
      {name}
    </button>
  );
};

export default GenreChip;
