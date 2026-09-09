import type { ReactNode } from "react";

export type IconName =
  | "solar"
  | "inverter"
  | "battery"
  | "ev"
  | "climate"
  | "layers"
  | "headset"
  | "map"
  | "target"
  | "box"
  | "arrow"
  | "hand"
  | "search"
  | "download";

type IconProps = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, ReactNode> = {
  solar: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M3 8h18M3 12h18M9 4v12M15 4v12" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  inverter: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M6 14c1.5-4 3-4 4.5 0S13 18 14.5 14 16.5 10 18 14" />
    </>
  ),
  battery: (
    <>
      <rect x="4" y="7" width="14" height="10" rx="2" />
      <path d="M20 10v4" />
      <path d="M8 12h4M10 10v4" />
    </>
  ),
  ev: (
    <>
      <path d="M7 21V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v15" />
      <path d="M4 21h14" />
      <path d="M15 9h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0v-6l-2-2" />
      <path d="M11 8l-2 4h3l-2 4" />
    </>
  ),
  climate: (
    <>
      <rect x="3" y="4" width="18" height="8" rx="2" />
      <path d="M7 8h.01M11 8h.01M15 8h6" />
      <path d="M7 16v2M12 16v3M17 16v2" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4" height="7" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="7" rx="1.5" />
      <path d="M20 20a4 4 0 0 1-4 3h-2" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  box: (
    <>
      <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  // Mano col dito indice alzato — il gesto del puntatore.
  hand: (
    <>
      <path d="M10 10V4.2a1.9 1.9 0 0 1 3.8 0V11" />
      <path d="M13.8 10.6V9.4a1.9 1.9 0 0 1 3.8 0V11" />
      <path d="M17.6 11.2v-.4a1.9 1.9 0 0 1 3.8 0V14a7.5 7.5 0 0 1-7.5 7.5h-1.4c-2.4 0-4-.8-5.4-2.2l-3.4-3.4a1.9 1.9 0 0 1 2.7-2.7L10 16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </>
  ),
};

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
