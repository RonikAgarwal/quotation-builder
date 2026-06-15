import { forwardRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown }, ref) => (
    <div className="search-wrapper">
      <input
        ref={ref}
        className="search"
        type="text"
        placeholder="Search products (e.g. 25 pipe, plain 25, quickfit 63)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  ),
);
SearchBar.displayName = 'SearchBar';
