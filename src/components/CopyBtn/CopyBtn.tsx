import React from 'react';
import './index.scss';
import { ClipboardManager } from './copy';

type CopyStatus = 'success' | '';

interface CopyBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  copyText?: string;
  onSuccess?: () => void;
  onFail?: () => void;
}

export default function CopyBtn({ width = 40, height = 40, color = 'var(--primary-text)', copyText = '', onSuccess, onFail }: CopyBtnProps) {
  const [copyStatus, setCopyStatus] = React.useState<CopyStatus>('');

  const instance = ClipboardManager.getInstance();

  const handleCopy = () => {
    if (!copyText || copyStatus === 'success') return;
    instance.copyText(copyText).then(() => {
      setCopyStatus('success');
      setTimeout(() => setCopyStatus(''), 1500);
      onSuccess?.();
    }).catch(() => {
      setCopyStatus('');
      onFail?.();
    });
  };

  return (
    <button
      className="wyx-ui_btns wyx-btn_copy"
      onClick={handleCopy}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        color,
      }}
    >
      {copyStatus === '' && (
        <svg className="wyx-icon_copy" viewBox="0 0 100 100">
        <path
          d="M25,35 L25,75 L65,75 L65,35 Z"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="var(--primary-text)"></path>
        <path
          d="M35,35 L35,25 L75,25 L75,65 L66,65"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="var(--primary-text)"></path>
      </svg>)}
      {copyStatus === 'success' && (
        <svg viewBox="0 0 150 150">
          <path id="check-path1" d="M40,75 L65,100 L110,55" />
        </svg>
      )}
    </button>
  );
}