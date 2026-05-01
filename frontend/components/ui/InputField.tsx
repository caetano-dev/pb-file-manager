import { ChangeEvent, HTMLInputTypeAttribute } from 'react';

interface InputFieldProps {
  label: string;
  type: HTMLInputTypeAttribute;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
}

export const InputField = ({ 
  label, 
  type, 
  value, 
  onChange, 
  required, 
  autoComplete 
}: InputFieldProps) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      required={required}
      autoComplete={autoComplete}
      className="w-full border p-2 rounded"
      value={value}
      onChange={onChange}
    />
  </div>
);