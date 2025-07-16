// Select component type definitions
export type SelectValue = string | number;

export type DataType = 'all' | 'content' | 'teams' | 'users' | 'analytics';
export type ExportFormat = 'json' | 'csv' | 'pdf';
export type DateRange = '7d' | '30d' | '90d' | 'custom';
export type ImportOperation = 'insert' | 'update' | 'upsert';
export type ValidationLevel = 'strict' | 'moderate' | 'lenient';

export interface ExportOptions {
  data_type: DataType;
  format: ExportFormat;
  date_range: DateRange;
}

export interface ImportOptions {
  data_type: DataType;
  operation: ImportOperation;
  validation_level: ValidationLevel;
}