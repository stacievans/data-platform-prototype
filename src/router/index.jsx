import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../components/Layout'
import LoginPage from '../pages/Login/LoginPage'
import Dashboard from '../pages/Dashboard'
import ProjectList from '../pages/Project'
import ProjectDetail from '../pages/Project/Detail'
import ProjectSampling from '../pages/Project/Sampling'
import TaskList from '../pages/Task'
import TaskDetail from '../pages/Task/Detail'
import UploadRecord from '../pages/UploadRecord'
import SelfDataset from '../pages/Dataset/Self'
import SelfDatasetDetail from '../pages/Dataset/SelfDetail'
import SelfDatasetDownload from '../pages/Dataset/SelfDownload'
import TagManage from '../pages/Tag'
import DeviceManage from '../pages/Device'
import UserManage from '../pages/System/UserManage'
import RoleManage from '../pages/System/RoleManage'
import OrgManage from '../pages/System/OrgManage'
import OrgDetail from '../pages/System/OrgDetail'
import ReviewWorkbench from '../pages/Review/Workbench'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/review/:entryId',
    element: <ReviewWorkbench />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'collection/project', element: <ProjectList /> },
      { path: 'collection/project/:id/sampling', element: <ProjectSampling /> },
      { path: 'collection/project/:id', element: <ProjectDetail /> },
      { path: 'collection/task', element: <TaskList /> },
      { path: 'collection/task/:id', element: <TaskDetail /> },
      { path: 'collection/upload', element: <UploadRecord /> },
      { path: 'dataset/self', element: <SelfDataset /> },
      { path: 'dataset/self/download', element: <SelfDatasetDownload /> },
      { path: 'dataset/self/:id', element: <SelfDatasetDetail /> },
      { path: 'dataset/open/download', element: <Navigate to="/dataset/self" replace /> },
      { path: 'dataset/open/:id/usage', element: <Navigate to="/dataset/self" replace /> },
      { path: 'dataset/open', element: <Navigate to="/dataset/self" replace /> },
      { path: 'dataset/open/*', element: <Navigate to="/dataset/self" replace /> },
      { path: 'tag', element: <TagManage /> },
      { path: 'device', element: <DeviceManage /> },
      { path: 'device/:typeId', element: <Navigate to="/device" replace /> },
      { path: 'system', element: <Navigate to="/system/user" replace /> },
      { path: 'system/user', element: <UserManage /> },
      { path: 'system/role', element: <RoleManage /> },
      { path: 'system/org/:id', element: <OrgDetail /> },
      { path: 'system/org', element: <OrgManage /> },
      { path: 'system/log', element: <Navigate to="/system/user" replace /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

export default router
