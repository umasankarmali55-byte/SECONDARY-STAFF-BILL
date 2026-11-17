import React, { useEffect, useRef } from 'react';

interface EditableCellProps {
  value: string;
  onCommit: (nextValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: 'span' | 'div';
  numeric?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onCommit,
  className = '',
  style,
  as = 'span',
  numeric = false,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const initialRef = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  const handleFocus = () => {
    initialRef.current = ref.current?.textContent ?? '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  const handleBlur = () => {
    const raw = ref.current?.textContent ?? '';
    if (raw === initialRef.current) return;
    const next = numeric ? raw.replace(/,/g, '').trim() : raw.trim();
    onCommit(next);
  };

  const Tag = as;

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      contentEditable
      suppressContentEditableWarning
      className={`ce ${className}`.trim()}
      style={style}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {value}
    </Tag>
  );
};
