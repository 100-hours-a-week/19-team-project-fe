'use client';

import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { createContext, forwardRef, useContext, useId } from 'react';

type InputContextValue = {
  id: string;
  invalid: boolean;
  messageId: string;
};

const InputContext = createContext<InputContextValue | null>(null);

function useInputContext(component: string) {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error(`Input.${component} must be used within <Input.Root>.`);
  }
  return context;
}

type InputRootProps = HTMLAttributes<HTMLDivElement> & {
  id?: string;
  invalid?: boolean;
};

function Root({ id, invalid = false, className = '', children, ...props }: InputRootProps) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const messageId = `${inputId}-message`;

  return (
    <InputContext.Provider value={{ id: inputId, invalid, messageId }}>
      <div className={`flex flex-col gap-2 ${className}`} {...props}>
        {children}
      </div>
    </InputContext.Provider>
  );
}

type InputLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

function Label({ className = '', ...props }: InputLabelProps) {
  const { id } = useInputContext('Label');

  return (
    <label className={`text-sm font-semibold text-gray-700 ${className}`} htmlFor={id} {...props} />
  );
}

type InputFieldProps = InputHTMLAttributes<HTMLInputElement>;

const Field = forwardRef<HTMLInputElement, InputFieldProps>(function Field(
  { className = '', ...props },
  ref,
) {
  const { id, invalid, messageId } = useInputContext('Field');

  return (
    <input
      ref={ref}
      id={id}
      aria-invalid={invalid}
      aria-describedby={messageId}
      className={`w-full rounded-md border px-4 py-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400 ${
        invalid
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-200 focus:border-primary-main focus:ring-primary-main/20'
      } ${className}`}
      {...props}
    />
  );
});

type InputMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: 'default' | 'error';
};

function Message({ tone = 'default', className = '', ...props }: InputMessageProps) {
  const { invalid, messageId } = useInputContext('Message');
  const isError = tone === 'error' || invalid;

  return (
    <p
      id={messageId}
      className={`text-xs ${isError ? 'text-red-500' : 'text-gray-500'} ${className}`}
      {...props}
    />
  );
}

export const Input = Object.assign(Root, {
  Root,
  Label,
  Field,
  Message,
});

export type { InputFieldProps, InputLabelProps, InputMessageProps, InputRootProps };
