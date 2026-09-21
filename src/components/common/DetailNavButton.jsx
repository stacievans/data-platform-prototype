/** 列表操作列「详情」蓝色实心小按钮 */
export default function DetailNavButton({ onClick, children = '详情' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 cursor-pointer rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-blue-700"
    >
      {children}
    </button>
  )
}
