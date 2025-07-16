
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showStrengthIndicator?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  required?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
}

export const PasswordField = ({ 
  value, 
  onChange, 
  placeholder = "Enter your password",
  label = "Password",
  showStrengthIndicator = false,
  onValidationChange,
  required = false,
  name = "password",
  id = "password",
  autoComplete = "current-password"
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-error ml-1" aria-label="required">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="pr-12"
          autoComplete={autoComplete}
          aria-describedby={showStrengthIndicator ? `${id}-strength` : undefined}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent focus-visible"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          tabIndex={0}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </div>
      
      {showStrengthIndicator && (
        <div id={`${id}-strength`}>
          <PasswordStrengthIndicator 
            password={value} 
            onValidationChange={onValidationChange}
          />
        </div>
      )}
    </div>
  );
};
