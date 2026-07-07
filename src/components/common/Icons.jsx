const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconDashboard = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

export const IconCollection = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <path d="M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" />
  </svg>
)

export const IconDataset = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
  </svg>
)

export const IconTag = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <path d="M20.6 13.4 12 4.8A2 2 0 0 0 10.6 4H5a1 1 0 0 0-1 1v5.6c0 .5.2 1 .6 1.4l8.6 8.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.8z" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

export const IconDevice = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 18v3" />
  </svg>
)

export const IconSystem = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)

export const IconChevron = ({ open, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    {...base}
    {...props}
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconChevronDown = (props) => (
  <svg viewBox="0 0 24 24" width="12" height="12" {...base} {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconCollapse = ({ collapsed, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    {...base}
    {...props}
    style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
  >
    <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
  </svg>
)

export const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

export const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconUpload = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5M12 3v12" />
  </svg>
)

export const IconDownload = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </svg>
)

export const IconGrid = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

export const IconList = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
)

export const IconClose = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

export const IconExternalLink = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props}>
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
)

export const IconLink = (props) => (
  <svg viewBox="0 0 24 24" width="12" height="12" {...base} {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

export const IconCopy = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props}>
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
)
