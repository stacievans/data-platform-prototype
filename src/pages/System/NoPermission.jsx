import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'

export default function NoPermission() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-white py-16 shadow-sm">
      <div className="mb-3 text-4xl opacity-40">🔒</div>
      <h2 className="text-lg font-semibold text-gray-800">无访问权限</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
        当前演示身份没有访问此页面的权限。可在右上角切换其他角色，或联系管理员分配权限。
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="primary">返回运营看板</Button>
      </Link>
    </div>
  )
}
