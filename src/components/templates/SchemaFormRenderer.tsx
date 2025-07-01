import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import type { FormFieldConfig } from '@/types/templateTypes';

interface SchemaFormRendererProps {
  fields: FormFieldConfig[];
  values: Record<string, any>;
  onValuesChange: (values: Record<string, any>) => void;
  onSubmit?: (values: Record<string, any>) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

const SchemaFormRenderer: React.FC<SchemaFormRendererProps> = ({
  fields,
  values,
  onValuesChange,
  onSubmit,
  isLoading = false,
  title = "Form",
  description
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: FormFieldConfig, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }

    if (field.validation && value) {
      const { minLength, maxLength, pattern } = field.validation;
      
      if (typeof value === 'string') {
        if (minLength && value.length < minLength) {
          return `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength && value.length > maxLength) {
          return `${field.label} must be no more than ${maxLength} characters`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return `${field.label} format is invalid`;
        }
      }
    }

    return null;
  }, []);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    const newValues = { ...values, [fieldName]: value };
    onValuesChange(newValues);

    // Validate the field
    const field = fields.find(f => f.name === fieldName);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }));
    }
  }, [values, onValuesChange, fields, validateField]);

  const shouldShowField = useCallback((field: FormFieldConfig): boolean => {
    if (!field.conditional) return true;

    const { field: condField, value: condValue, operator } = field.conditional;
    const actualValue = values[condField];

    switch (operator) {
      case 'equals':
        return actualValue === condValue;
      case 'not_equals':
        return actualValue !== condValue;
      case 'contains':
        return typeof actualValue === 'string' && actualValue.includes(condValue);
      case 'not_contains':
        return typeof actualValue === 'string' && !actualValue.includes(condValue);
      default:
        return true;
    }
  }, [values]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      if (shouldShowField(field)) {
        const error = validateField(field, values[field.name]);
        if (error) {
          newErrors[field.name] = error;
          hasErrors = true;
        }
      }
    });

    setErrors(newErrors);

    if (!hasErrors && onSubmit) {
      onSubmit(values);
    }
  }, [fields, values, validateField, shouldShowField, onSubmit]);

  const renderField = useCallback((field: FormFieldConfig) => {
    if (!shouldShowField(field)) return null;

    const fieldValue = values[field.name] || '';
    const fieldError = errors[field.name];

    const fieldProps = {
      id: field.name,
      value: fieldValue,
      onChange: (value: any) => handleFieldChange(field.name, value),
      placeholder: field.placeholder,
      className: fieldError ? 'border-error' : ''
    };

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-error ml-1">*</span>}
            </Label>
            <Input
              {...fieldProps}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
            {fieldError && <p className="text-error text-sm">{fieldError}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-error ml-1">*</span>}
            </Label>
            <Textarea
              {...fieldProps}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              rows={4}
            />
            {fieldError && <p className="text-error text-sm">{fieldError}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-error ml-1">*</span>}
            </Label>
            <Select value={fieldValue} onValueChange={(value) => handleFieldChange(field.name, value)}>
              <SelectTrigger className={fieldError ? 'border-error' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && <p className="text-error text-sm">{fieldError}</p>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-error ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={(fieldValue || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = fieldValue || [];
                      const newValues = checked 
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleFieldChange(field.name, newValues);
                    }}
                  />
                  <Label 
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {fieldError && <p className="text-error text-sm">{fieldError}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-error ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                {...fieldProps}
                type="date"
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
            {fieldError && <p className="text-error text-sm">{fieldError}</p>}
          </div>
        );

      case 'code':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-error ml-1">*</span>}
            </Label>
            <Textarea
              {...fieldProps}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="font-mono text-sm"
              rows={6}
            />
            {fieldError && <p className="text-error text-sm">{fieldError}</p>}
          </div>
        );

      default:
        return null;
    }
  }, [values, errors, shouldShowField, handleFieldChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(renderField)}
          
          {onSubmit && (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Generate Content'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default SchemaFormRenderer;