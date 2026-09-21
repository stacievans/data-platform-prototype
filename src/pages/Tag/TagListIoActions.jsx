import { IconDownload, IconUpload } from '../../components/common/Icons'
import { PermButton } from '../../components/common/PermissionAction'
import { useCurrentNickname } from '../../context/AuthContext'
import { downloadJsonFile, openJsonFilePicker, readJsonImportFile } from '../../utils/jsonImportExport'

export default function TagListIoActions({
  showToast,
  exportFilename,
  buildExport,
  runImport,
  onImported,
  hideExport = false,
}) {
  const creatorName = useCurrentNickname()

  const handleExport = () => {
    if (!buildExport || !exportFilename) return
    downloadJsonFile(exportFilename, buildExport())
  }

  const handleImport = () => {
    openJsonFilePicker(async (file) => {
      const parsed = await readJsonImportFile(file)
      if (!parsed.ok) {
        showToast(parsed.message)
        return
      }
      const result = runImport(parsed.data, creatorName)
      if (!result.ok) {
        showToast(result.message)
        return
      }
      onImported?.()
      showToast(`导入成功，新增 ${result.added} 条，跳过 ${result.skipped} 条重名`)
    })
  }

  return (
    <>
      <PermButton permission="tag.create" icon={<IconUpload />} onClick={handleImport}>
        导入
      </PermButton>
      {!hideExport && (
        <PermButton permission="tag.view" icon={<IconDownload />} onClick={handleExport}>
          导出
        </PermButton>
      )}
    </>
  )
}
