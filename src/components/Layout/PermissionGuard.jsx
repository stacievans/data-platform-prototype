import { useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NoPermission from '../../pages/System/NoPermission'

function PermissionGuard() {
  const { canAccessRoute } = useAuth()
  const { pathname } = useLocation()
  if (!canAccessRoute(pathname)) return <NoPermission />
  return <Outlet />
}

export default PermissionGuard
