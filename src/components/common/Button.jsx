const variants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 border border-transparent shadow-sm',
  default:
    'bg-white text-gray-700 border border-gray-300 hover:text-blue-600 hover:border-blue-500',
  danger:
    'bg-white text-red-600 border border-red-300 hover:bg-red-50',
  link: 'text-blue-600 hover:text-blue-500 border border-transparent px-1',
  linkDanger: 'text-red-500 hover:text-red-400 border border-transparent px-1',
}

const sizes = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-4 text-sm',
}

export default function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  ...rest
}) {
  const isLink = variant === 'link' || variant === 'linkDanger'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
        isLink ? 'text-sm h-auto' : sizes[size]
      } ${variants[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
