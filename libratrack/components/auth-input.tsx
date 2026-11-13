import type { InputHTMLAttributes, ReactNode } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  leadingIcon: ReactNode;
  trailingControl?: ReactNode;
  helperText?: ReactNode;
};

export default function AuthInput({ label, leadingIcon, trailingControl, helperText, className = "", ...inputProps }: AuthInputProps) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <div className="auth-input-row group relative mt-2">
        <span className="auth-input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 transition-colors duration-200 group-focus-within:text-indigo-600 dark:text-slate-500" aria-hidden="true">
          {leadingIcon}
        </span>
        <input
          {...inputProps}
          className={`auth-field-control block h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 text-sm font-normal text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-400 ${trailingControl ? "pr-12" : "pr-3"} ${className}`}
        />
        {trailingControl}
      </div>
      {helperText}
    </label>
  );
}
