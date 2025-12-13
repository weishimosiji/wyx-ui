import './index.scss';

export default function Loading(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} className="wyx-icon_loading circular" width="24" height="24" viewBox="0 0 50 50">
      <circle className="path" cx="25" cy="25" r="20" strokeWidth="5" fill="transparent" />
    </svg>
  );
}