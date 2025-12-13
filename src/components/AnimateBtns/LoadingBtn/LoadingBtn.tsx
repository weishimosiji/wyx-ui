import './index.scss';

interface LoadingBtnProps {
  status?: 'loading' | 'success' | 'fail';
}

export default function LoadingBtn({ status = 'loading', ...props }: LoadingBtnProps) {
  return (
    <button className={`wyx-ui_btns wyx-btn_loading`} {...props}>
      {status === 'loading' && (
        <svg className="circular" viewBox="0 0 50 50">
          <circle className="path" cx="25" cy="25" r="20" strokeWidth="5" fill="transparent" />
        </svg>
      )}
      {status === 'fail' && (
        <svg viewBox="0 0 150 150">
          <path id="x-path1" d="M40,40 L110,110" />
          <path id="x-path2" d="M110,40 L40,110" />
        </svg>
      )}
      {status === 'success' && (
        <svg viewBox="0 0 150 150">
          <path id="check-path1" d="M40,75 L65,100 L110,55" />
        </svg>
      )}
    </button>
  );
}