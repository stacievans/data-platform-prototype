import { useState } from 'react'
import { useToast } from '../../components/common/Toast'

const CLI_CODE = `# 安装 CLI 工具
pip install alphaloop-cli

# 下载指定真机数据集到本地目录
alphaloop dataset download \\
  --dataset-id DS-001 \\
  --output ./downloads/

# 按数据状态 / 格式筛选下载
alphaloop dataset download \\
  --dataset-id DS-001 \\
  --status 已标注 \\
  --format LeRobot \\
  --output ./downloads/filtered/`

const SDK_CODE = `pip install alphaloop-data-sdk

from alphaloop import DatasetClient

client = DatasetClient(api_key="YOUR_API_KEY")

# 下载整个数据集
client.download(
    dataset_id="DS-001",
    output_dir="./downloads/",
)

# 指定格式与状态
client.download(
    dataset_id="DS-001",
    output_dir="./downloads/filtered/",
    formats=["h5", "LeRobot"],
    statuses=["已解析", "已标注"],
)`

function CodeBlock({ title, code, onCopy }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onCopy?.('复制失败，请手动选择代码')
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="cursor-pointer rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="flex-1 overflow-x-auto bg-slate-900 p-4 text-xs leading-6 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function SelfDatasetDownload() {
  const { ToastNode, show } = useToast()

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">真机数据集下载说明</h2>
        <p className="mt-3 text-sm text-amber-600">
          示例代码，以实际 SDK 为准
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CodeBlock title="CLI" code={CLI_CODE} onCopy={() => show('CLI 示例代码已复制')} />
        <CodeBlock title="SDK" code={SDK_CODE} onCopy={() => show('SDK 示例代码已复制')} />
      </div>

      {ToastNode}
    </div>
  )
}
