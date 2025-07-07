import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
interface PageHeaderProps {
  title: string;
  description?: string;
  showExport?: boolean;
  showDateFilter?: boolean;
  dateFilter?: string;
  onExport?: () => void;
  onDateFilterChange?: (filter: string) => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
}
const PageHeader = ({
  title,
  description,
  showExport = false,
  showDateFilter = false,
  dateFilter = "Last 30 days",
  onExport,
  onDateFilterChange,
  action,
  children
}: PageHeaderProps) => {
  return <div className="border-b border-border pb-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-md text-primary font-display">{title}</h1>
          {description && <p className="mt-2 text-body text-violet-400">
              {description}
            </p>}
        </div>
        
        <div className="flex items-center gap-3">
          {showDateFilter && <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface-elevated">
              <Calendar className="h-4 w-4 text-tertiary" />
              <select value={dateFilter} onChange={e => onDateFilterChange?.(e.target.value)} className="bg-transparent text-sm font-medium text-primary border-none outline-none">
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 90 days">Last 90 days</option>
              </select>
            </div>}
          
          {showExport && <Button onClick={onExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>}
          
          {action}
          {children}
        </div>
      </div>
    </div>;
};
export default PageHeader;