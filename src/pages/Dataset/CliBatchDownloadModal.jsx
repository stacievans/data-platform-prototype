import { useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { IconCopy } from '../../components/common/Icons'

function toNumericTaskId(entry) {
  const n = parseInt(String(entry?.taskId ?? '').replace(/\D/g, ''), 10) || 197
  return n >= 1000 ? n % 900 + 100 : n
}

function toNumericItemId(entry) {
  const base = parseInt(String(entry.fileId || entry.id).replace(/\D/g, ''), 10) || 1
  return String(342860000000000000 + base * 10000001).slice(0, 18)
}

export function buildCliBatchCommands(selectedEntries, platform = 'unix') {
  const taskId = toNumericTaskId(selectedEntries[0])
  const itemIds = selectedEntries.map(toNumericItemId).join(',')
  const install = platform === 'unix'
    ? 'curl -fsSL https://file.ai2robo.com/data-collect-cli/install.sh | bash'
    : 'irm https://file.ai2robo.com/data-collect-cli/install.ps1 | iex'
  const login = "data-collector-cli login -u admin -p '请输入密码'"
  const outputDir = platform === 'unix'
    ? '~/Downloads/ABC-Data'
    : '$env:USERPROFILE\\Downloads\\ABC-Data'
  const download = `data-collector-cli download --download-type item --task-id ${taskId} --item-id ${itemIds} --output-dir ${outputDir}`
  return { install, login, download, all: `${install}\n\n${login}\n\n${download}` }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function PlatformToggle({ value, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-gray-200 text-xs">
      <button
        type="button"
        onClick={() => onChange('unix')}
        className={`cursor-pointer px-3 py-1.5 transition ${
          value === 'unix' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        macOS / Linux
      </button>
      <button
        type="button"
        onClick={() => onChange('windows')}
        className={`cursor-pointer border-l border-gray-200 px-3 py-1.5 transition ${
          value === 'windows' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Windows PowerShell
      </button>
    </div>
  )
}

function CliCodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyText(code)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative rounded-md bg-[#141414] px-4 py-3.5 pr-12">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[13px] leading-6 text-white/95">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/60 transition hover:text-white"
        aria-label="复制命令"
        title={copied ? '已复制' : '复制'}
      >
        <IconCopy width={16} height={16} />
      </button>
    </div>
  )
}

function StepSection({ title, hint, extra, children }) {
  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
        {extra}
      </div>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-gray-400">{hint}</p> : null}
    </section>
  )
}

export default function CliBatchDownloadModal({ open, selectedEntries, onClose }) {
  const [platform, setPlatform] = useState('unix')
  const [allCopied, setAllCopied] = useState(false)

  const commands = useMemo(
    () => buildCliBatchCommands(selectedEntries, platform),
    [selectedEntries, platform],
  )

  const handleCopyAll = async () => {
    const ok = await copyText(commands.all)
    if (ok) {
      setAllCopied(true)
      setTimeout(() => setAllCopied(false), 2000)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      title="终端 CLI 批量下载"
      onCancel={onClose}
      width={760}
      fitViewport
      viewportMaxHeight="90vh"
      bodyClassName="space-y-5"
      footer={(
        <>
          <Button onClick={onClose}>关闭</Button>
          <Button variant="primary" icon={<IconCopy width={14} height={14} />} onClick={handleCopyAll}>
            {allCopied ? '已复制' : '复制全部命令'}
          </Button>
        </>
      )}
    >
      <div className="flex items-center justify-between gap-3 rounded-md bg-blue-50 px-4 py-2.5">
        <span className="text-sm text-gray-700">请在终端中依次执行以下命令</span>
        <span className="shrink-0 rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600">
          已选择 {selectedEntries.length} 个条目
        </span>
      </div>

      <StepSection
        title={(
          <>
            1. 安装 Data Collector CLI
            <span className="ml-2 font-normal text-gray-400">已安装可跳过</span>
          </>
        )}
        extra={<PlatformToggle value={platform} onChange={setPlatform} />}
        hint={(
          <>
            安装完成后请重新打开终端。遇到问题可查看{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500" onClick={(e) => e.preventDefault()}>
              完整安装文档
            </a>
            。
          </>
        )}
      >
        <CliCodeBlock code={commands.install} />
      </StepSection>

      <StepSection
        title="2. 登录 Data Collector CLI"
        hint="用户名已自动填入。请将单引号中的「请输入密码」替换为实际密码。"
      >
        <CliCodeBlock code={commands.login} />
      </StepSection>

      <StepSection title="3. 下载已选择的条目">
        <CliCodeBlock code={commands.download} />
      </StepSection>
    </Modal>
  )
}
