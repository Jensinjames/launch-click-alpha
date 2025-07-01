import { useState, useRef } from "react";
interface CategoryFiltersProps {
  onFilterChange?: (filter: string) => void;
}
const CategoryFilters = ({
  onFilterChange
}: CategoryFiltersProps) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const filtersRef = useRef<HTMLDivElement>(null);
  const filters = ["All", "Email Marketing", "Automation", "Database", "Website"];
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };
  const handleKeyDown = (event: React.KeyboardEvent, filter: string) => {
    const currentIndex = filters.indexOf(filter);
    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : filters.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < filters.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = filters.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleFilterChange(filter);
        return;
      default:
        return;
    }

    // Focus the next button
    const buttons = filtersRef.current?.querySelectorAll('button');
    if (buttons && buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLButtonElement).focus();
    }
  };
  return <div className="mb-8">
      <h2 className="sr-only">Filter integrations by category</h2>
      <div ref={filtersRef} className="flex flex-wrap gap-3" role="tablist" aria-label="Integration categories">
        {filters.map((filter, index) => <button key={filter} onClick={() => handleFilterChange(filter)} onKeyDown={e => handleKeyDown(e, filter)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${activeFilter === filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`} role="tab" aria-selected={activeFilter === filter} aria-describedby={`filter-${filter.replace(/\s+/g, '-').toLowerCase()}-description`} tabIndex={activeFilter === filter ? 0 : -1}>
            {filter}
            <span id={`filter-${filter.replace(/\s+/g, '-').toLowerCase()}-description`} className="sr-only">
              {activeFilter === filter ? 'Currently selected filter' : 'Click to filter by'} {filter}
            </span>
          </button>)}
      </div>
      <div aria-live="polite" aria-atomic="true" className="mt-2 text-sm text-muted-foreground bg-transparent">
        {activeFilter === "All" ? "Showing all integrations" : `Showing ${activeFilter} integrations`}
      </div>
    </div>;
};
export default CategoryFilters;