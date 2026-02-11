import { useState } from 'react';

export type ValidationRules<T> = {
  [K in keyof T]?: Array<{
    validate: (value: T[K], formData: T) => boolean;
    message: string;
  }>;
};

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = <K extends keyof T>(
    name: K,
    value: T[K]
  ): string | undefined => {
    const rules = validationRules[name];
    if (!rules) return undefined;

    for (const rule of rules) {
      if (!rule.validate(value, values)) {
        return rule.message;
      }
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const name of Object.keys(validationRules) as Array<keyof T>) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = <K extends keyof T>(name: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name, values[name]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    setValues,
    setErrors,
  };
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => ({
    validate: (value: unknown) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  email: (message = 'Invalid email address') => ({
    validate: (value: string) => /\S+@\S+\.\S+/.test(value),
    message,
  }),

  minLength: (min: number, message?: string) => ({
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string) => ({
    validate: (value: string) => value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  matches: (field: string, message = 'Fields do not match') => ({
    validate: (value: unknown, formData: Record<string, unknown>) =>
      value === formData[field],
    message,
  }),

  pattern: (regex: RegExp, message = 'Invalid format') => ({
    validate: (value: string) => regex.test(value),
    message,
  }),
};
