import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { useToast } from '../../components/common/Toast'
import { getOpenDatasetById } from '../../mock/datasets'
import { getOpenDatasetMetrics } from '../../utils/openDatasetMetrics'

const levelColor = (v) =>
  v === 'L1' ? 'purple' : v === 'L2' ? 'blue' : v === 'L3' ? 'cyan' : 'orange'

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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
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
      <pre className="min-h-[280px] flex-1 overflow-x-auto bg-slate-900 p-4 text-xs leading-6 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function buildCliCode(dataset) {
  return `# 安装 CLI 工具
pip install alphaloop-cli

# 加载开源数据集到本地
alphaloop open-dataset load \\
  --dataset-id ${dataset.id} \\
  --output ./downloads/${dataset.id}/

# 指定层级与格式筛选
alphaloop open-dataset load \\
  --dataset-id ${dataset.id} \\
  --level ${dataset.level} \\
  --format LeRobot \\
  --output ./downloads/${dataset.id}/filtered/`
}

function buildSdkCode(dataset) {
  return `pip install alphaloop-data-sdk

from alphaloop import OpenDatasetClient

client = OpenDatasetClient(api_key="YOUR_API_KEY")

# 加载整个开源数据集
client.load(
    dataset_id="${dataset.id}",
    output_dir="./downloads/${dataset.id}/",
)

# 按层级筛选子集
client.load(
    dataset_id="${dataset.id}",
    output_dir="./downloads/${dataset.id}/subset/",
    level="${dataset.level}",
    formats=["h5", "LeRobot"],
)`
}

export default function OpenDatasetUsage() {
  const { id } = useParams()
  const dataset = useMemo(() => getOpenDatasetById(id), [id])
  const { ToastNode, show } = useToast()

  if (!dataset) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-16 text-center shadow-sm">
        <p className="text-gray-500">未找到数据集 {id}</p>
        <Link to="/dataset/open" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          返回开源数据集列表
        </Link>
      </div>
    )
  }

  const { dataSize, trajCount } = getOpenDatasetMetrics(dataset)
  const cliCode = buildCliCode(dataset)
  const sdkCode = buildSdkCode(dataset)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-800">{dataset.name}</h2>
            <p className="mt-1 text-sm text-gray-400">{dataset.id} · {dataset.publisher}</p>
            <p className="mt-1 text-sm text-gray-500">
              {dataset.description || '暂无描述'}
            </p>
          </div>
          <Button onClick={() => show('SDK 下载功能即将开放')}>下载 SDK</Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <div className="text-xs text-gray-400">层级</div>
            <div className="mt-0.5">
              <Badge color={levelColor(dataset.level)}>{dataset.level}</Badge>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">数据量</div>
            <div className="mt-0.5 font-medium text-gray-700">{dataSize}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">轨迹数量</div>
            <div className="mt-0.5 font-medium text-gray-700">{trajCount}</div>
          </div>
          <div className="min-w-0 max-w-md flex-1">
            <div className="text-xs text-gray-400">原始数据集链接</div>
            <div className="mt-0.5">
              {dataset.externalLink ? (
                <a
                  href={dataset.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-medium text-blue-600 hover:underline"
                >
                  {dataset.externalLink}
                </a>
              ) : (
                <span className="text-gray-400">暂无链接</span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-amber-600">示例代码，以实际 SDK 为准</p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <CodeBlock title="CLI" code={cliCode} onCopy={() => show('CLI 示例代码已复制')} />
        <CodeBlock title="SDK" code={sdkCode} onCopy={() => show('SDK 示例代码已复制')} />
      </div>

      {ToastNode}
    </div>
  )
}
