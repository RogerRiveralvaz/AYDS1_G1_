import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { cn } from "../../utils/cn";
import { Input } from "./Input";

type SearchInputProps = {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ defaultValue = "", placeholder = "Buscar…", onSearch, debounceMs = 350, className }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState(defaultValue);

    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    useEffect(() => {
      const handle = window.setTimeout(() => {
        onSearch(value.trim());
      }, debounceMs);

      return () => window.clearTimeout(handle);
    }, [value, onSearch, debounceMs]);

    return (
      <div className={cn("relative", className)}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <Input
          ref={innerRef}
          type="search"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder={placeholder}
          className="pl-10"
          aria-label={placeholder}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
