
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type SortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'price-asc' | 'price-desc';

interface SortControlsProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SortControls = ({ sortOption, onSortChange }: SortControlsProps) => {
  const sortOptions = [
    { value: 'alphabetical-asc', label: 'Alphabetical A-Z' },
    { value: 'alphabetical-desc', label: 'Alphabetical Z-A' },
    { value: 'price-asc', label: 'Price Low to High' },
    { value: 'price-desc', label: 'Price High to Low' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-white/80 font-medium">Sort by:</span>
          <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              {sortOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-white hover:bg-white/10"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SortControls;
