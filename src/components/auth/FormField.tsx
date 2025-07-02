
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
  className?: string;
  name?: string;
  'aria-describedby'?: string;
}

const FormField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  autoComplete,
  className,
  name,
  'aria-describedby': ariaDescribedBy,
}: FormFieldProps) => {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <Input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={cn(
          "mt-1",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500"
        )}
        aria-invalid={!!error}
        aria-describedby={cn(
          error ? errorId : undefined,
          ariaDescribedBy ? helpId : undefined
        )}
      />
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600 mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
