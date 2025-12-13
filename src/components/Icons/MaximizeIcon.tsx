export default function MaximizeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 15 6 6"/>
      <path d="M21 16v5h-5"/>
      <path d="M3 8V3h5"/>
      <path d="M9 9 3 3"/>
    </svg>
  );
}