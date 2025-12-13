import React from 'react';

export interface PointTextProps {
  keywords: string | string[];
  text?: string;
  ignoreCase?: boolean;
  highlightColor?: string;
  highlightBg?: string;
  highlightClassName?: string;
  hideIfNoMatch?: boolean;
  custom?: React.ReactElement | ((matched: string, index: number) => React.ReactNode);
  className?: string;
  style?: React.CSSProperties;
}

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderWithNewlines(text: string, keyPrefix: string = ''): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line) nodes.push(line);
    if (i < lines.length - 1) nodes.push(<br key={`${keyPrefix}-${i}`} />);
  });
  return nodes;
}

export default function PointText({ children, ...props }: React.PropsWithChildren<PointTextProps>) {
  const {
    keywords,
    text,
    ignoreCase = true,
    highlightColor = '#111',
    highlightBg = 'rgba(255, 235, 0, 0.4)',
    highlightClassName,
    hideIfNoMatch = false,
    custom,
    className,
    style,
  } = props;

  const extractText = (node: React.ReactNode): string => {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (React.isValidElement(node)) {
      if (node.type === 'br') return '\n';
      return extractText(node.props.children);
    }
    return '';
  };

  const input = typeof text === 'string' ? text : extractText(children);
  const keys = Array.isArray(keywords) ? keywords : [keywords];
  const terms = keys.map((k) => String(k).trim()).filter((k) => k.length > 0);
  if (!input) return <span className={`wyx-ui wyx-point-text ${className || ''}`} style={style}>{children}</span>;
  if (terms.length === 0) {
    return (
      <span className={`wyx-ui wyx-point-text ${className || ''}`} style={style}>
        {renderWithNewlines(input, 'no-match')}
      </span>
    );
  }

  const pattern = terms.map((t) => esc(t)).join('|');
  const re = new RegExp(pattern, ignoreCase ? 'gi' : 'g');
  const out: React.ReactNode[] = [];
  let last = 0;
  let count = 0;
  for (;;) {
    const m = re.exec(input);
    if (!m) break;
    if (m.index > last) {
      renderWithNewlines(input.slice(last, m.index), `pre-${count}`).forEach(n => out.push(n));
    }
    const matched = m[0];
    const node = typeof custom === 'function'
      ? custom(matched, count)
      : (React.isValidElement(custom)
          ? React.cloneElement(custom as React.ReactElement<any>, { children: matched })
          : (
            <mark
              className={highlightClassName}
              style={{ color: highlightColor, background: highlightBg }}
            >
              {matched}
            </mark>
          ));
    out.push(React.isValidElement(node) ? React.cloneElement(node as React.ReactElement<any>, { key: `${m.index}-${count}` }) : <span key={`${m.index}-${count}`}>{node}</span>);
    count++;
    last = re.lastIndex;
  }
  if (last < input.length) {
    renderWithNewlines(input.slice(last), 'end').forEach(n => out.push(n));
  }
  if (hideIfNoMatch && count === 0) return null;

  return (
    <span className={`wyx-ui wyx-point-text ${className || ''}`} style={style}>
      {out}
    </span>
  );
}
