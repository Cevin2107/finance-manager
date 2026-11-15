'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { formatMoney, inputClassName } from '@/components/dashboard/FinanceUI';

const suggestionMultipliers = [1_000, 10_000, 100_000] as const;

function formatAmount(value: number) {
  return value > 0 ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) : '';
}

function formatDigits(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getCursorPosition(value: string, digitsBeforeCursor: number) {
  if (digitsBeforeCursor === 0) return 0;

  let digitsSeen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) digitsSeen += 1;
    if (digitsSeen === digitsBeforeCursor) return index + 1;
  }

  return value.length;
}

export function MoneyInput({
  value,
  onChange,
  required = false,
  placeholder = 'Ví dụ: 150.000',
}: {
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState(() => formatAmount(value));
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setDisplayValue(formatAmount(value));
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const enteredValue = event.currentTarget.value;
    const cursorPosition = event.currentTarget.selectionStart ?? enteredValue.length;
    const digitsBeforeCursor = enteredValue.slice(0, cursorPosition).replace(/\D/g, '').length;
    const digits = enteredValue.replace(/\D/g, '');
    const nextValue = digits ? Number(digits) : 0;
    const formattedValue = formatDigits(digits);

    setDisplayValue(formattedValue);
    setShowSuggestions(digits.length > 0);
    onChange(Number.isFinite(nextValue) ? nextValue : 0);

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      const nextCursor = getCursorPosition(formattedValue, digitsBeforeCursor);
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const baseAmount = Number(displayValue.replace(/\D/g, ''));
  const suggestions =
    showSuggestions && Number.isSafeInteger(baseAmount) && baseAmount > 0
      ? suggestionMultipliers
          .map((multiplier) => baseAmount * multiplier)
          .filter((amount) => Number.isSafeInteger(amount))
      : [];

  return (
    <div
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setShowSuggestions(false);
        }
      }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          required={required}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={displayValue}
          onChange={handleChange}
          className={`${inputClassName} pr-10`}
          placeholder={placeholder}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">đ</span>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Gợi ý số tiền">
          {suggestions.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setDisplayValue(formatAmount(amount));
                setShowSuggestions(false);
                onChange(amount);
              }}
              className="min-h-11 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              {formatMoney(amount).replace(' ₫', 'đ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
