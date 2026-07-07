# ABC-Data — 数据采集平台前端原型

基于 **Vite 8 + React 19 + Tailwind CSS 4 + react-router-dom 7** 的数据采集平台前端原型。  
所有数据为前端 mock，无需后端，开箱即用。

**核心能力**：运营看板 · 采集项目/任务/上传 · 审核工作台（播放/审核/验收）· 真机/开源数据集 · 标签与设备管理 · RBAC 权限演示（菜单/路由/按钮/数据范围）。

---

## 目录

- [快速启动](#快速启动)
- [全局布局](#全局布局)
- [RBAC 权限体系](#rbac-权限体系)
  - [平台角色与项目成员角色](#平台角色与项目成员角色)
  - [创建人自动填充](#创建人自动填充)
- [功能模块总览](#功能模块总览)
- [目录结构](#目录结构)
- [技术说明](#技术说明)
- [Mock 数据规模](#mock-数据规模)
- [路由一览](#路由一览)

---

## 快速启动

```bash
# 安装依赖（需 Node.js ≥ 18）
npm install

# 启动开发服务器，默认端口 5173
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

访问 [http://localhost:5173](http://localhost:5173)，根路径 `/` 重定向至登录页；账号密码任意输入即可进入（不校验、不持久化）。

---

## 全局布局

登录后进入带侧边栏的主框架（`Layout/index.jsx`），内容区由 `PermissionGuard` 包裹后再渲染子路由：

| 区域 | 说明 |
|---|---|
| 顶栏 `Header` | 左侧 Logo + 侧边栏折叠按钮；右侧显示当前角色 + 用户头像下拉 |
| 侧边栏 `Sidebar` | 深色导航，支持折叠；按 RBAC **view** 权限过滤菜单项与子菜单 |
| 面包屑 `Breadcrumb` | 内容区顶部路径导航；系统管理下按路由分别显示「用户管理 / 角色管理 / 系统日志」 |
| 内容区 | 各业务页面；无路由 **view** 权限时渲染 `NoPermission`（非独立路由） |

**顶栏用户下拉**：
- **默认身份**：管理员 · **张华**（`zhanghua@ai2robotics.com`，U-001），拥有全部权限
- **演示身份切换**：展开后可切换 5 个预设身份（见 [RBAC → 演示身份](#演示身份切换)）；切换后 Toast 提示，侧边栏与按钮即时更新
- **退出登录**：跳转 `/login`（不清理 mock 运行时数据）

**审核工作台**（`/review/:entryId`）为**独立全屏页面**，不包含侧边栏与面包屑，在新标签页打开。

---

## RBAC 权限体系

原型实现 **功能权限**（菜单 / 路由 / 部分按钮）+ **数据范围**（采集员 / 标注员任务与上传过滤）。用户与角色为 **一对一** 绑定，不支持多角色权限合并。

### 平台角色与项目成员角色

原型中存在两套互不替代的角色概念：

| 维度 | 平台角色（系统角色） | 项目成员角色 |
|---|---|---|
| 绑定对象 | 用户账号（`users.role`） | 项目人员 Tab 成员（`projectMembers.roles[]`） |
| 配置位置 | 用户管理 / 角色管理 | 项目详情 → 项目人员 |
| 可选值 | 管理员、平台运营、采集员、标注员、**游客**、**工程师** | 采集员、标注员（平台运营由创建人合成） |
| 作用 | 侧边栏、路由、按钮 **功能权限**；部分 **数据范围** | 仅影响该项目下的任务/条目 **数据范围** |
| 多选 | 否（一人一角色） | 是（同一人可兼采集员+标注员等） |

> **游客**（R-005）为只读型平台角色，可浏览看板与数据集等，无 `collection.*` 权限、无数据集下载。**工程师**（R-006）在游客基础上保留数据集 **view + download**。

### 架构

```
AuthProvider (AuthContext.jsx)
  ├─ user          ← misc.js users + rbac.js USER_EMAILS
  ├─ roles         ← rbac.js 运行时角色（permissions[] 会话内可改）
  ├─ can(key)      ← 当前用户角色是否含 permission key
  ├─ canAccessRoute(pathname) ← permissions.js ROUTE_VIEW_PERMISSION
  ├─ switchUser(uid) / saveRolePermissions / addRole
  └─ useCurrentNickname / useCurrentUsername ← 创建人自动填充等

permissions.js   权限目录 permissionCatalog、preset、数据范围 helper
rbac.js          内置角色 + DEMO_PERSONAS + updateRolePermissions
Sidebar          按 view 过滤菜单
PermissionGuard  直链拦截 → NoPermission
PermissionAction PermButton / PermAction / PermMenuItem（顶部 hide、行内 disable+Tooltip）
页面组件         数据范围 filter + 操作按钮权限
```

### 演示身份切换

顶栏「演示身份切换」仅列出 **启用** 状态的预设账号（`rbac.js` → `DEMO_PERSONAS`）：

| UID | 展示标签 | 角色 | 邮箱 |
|---|---|---|---|
| U-001 | 管理员（张华） | 管理员 | `zhanghua@ai2robotics.com` |
| U-002 | 平台运营（李明） | 平台运营 | `ming.li@ai2robotics.com` |
| U-004 | 采集员（刘伟） | 采集员 | `liuwei@ai2robotics.com` |
| U-006 | 标注员（孙丽） | 标注员 | `sunli@ai2robotics.com` |
| U-009 | 游客（赵研） | 游客 | `zhao.yan@ai2robotics.com` |
| U-010 | 工程师（陈工） | 工程师 | `cheng.gong@ai2robotics.com` |

> 用户管理页新增/编辑用户为 **页面本地 state**，不影响上述演示切换（切换仍读取 `misc.js` 初始 users）。

### 权限 key 约定

格式 `{模块}.{操作}`，模块与侧边栏对齐，定义于 `mock/permissions.js` → `permissionCatalog`：

| 模块 | permission 前缀 | 可用操作 |
|---|---|---|
| 运营看板 | `dashboard` | view |
| 采集项目 | `collection.project` | view, create, edit, delete, archive |
| 采集任务 | `collection.task` | view, create, edit, delete |
| 上传记录 | `collection.upload` | view, download, delete |
| 真机数据集 | `dataset.self` | view, create, edit, delete, update, download |
| 开源数据集 | `dataset.open` | view, import, download |
| 标签管理 | `tag` | view, create, edit, delete |
| 设备管理 | `device` | view, create, edit, delete |
| 用户管理 | `system.user` | view, create, edit |
| 角色管理 | `system.role` | view, create, assignPerm |
| 系统日志 | `system.log` | view, export |

`RolePermissionModal` 编辑权限时：若勾选某模块非 view 操作，保存会自动补全该模块的 **view**。

### 内置角色 preset

`rbac.js` 预置 **6 个内置角色**（`type: '内置'`），权限由 `permissions.js` → `buildRolePermissionPreset` 生成：

| ID | 角色 | 描述（摘要） |
|---|---|---|
| R-001 | 管理员 | 平台最高权限 |
| R-002 | 平台运营 | 管理采集项目/任务，查看数据集与报表 |
| R-003 | 采集员 | 执行采集任务，上传数据 |
| R-004 | 标注员 | 审核采集数据，质检标注 |
| R-005 | **游客** | 查看数据集、标签与设备（无采集模块、无下载） |
| R-006 | **工程师** | 查看并下载数据集、标签与设备（无采集模块） |

| 角色 | 权限范围（摘要） |
|---|---|
| **管理员** | 全部 permission key |
| **平台运营** | 除 `system.*` 外全部；`tag.*` / `device.*` 仅 **view**（可浏览不可新建/编辑/删除） |
| **采集员** | 与标注员相同：`dashboard.view`；`collection.project/task/upload` 的 view + upload download；`dataset.self/open` 的 view + download；`tag.view`；`device.view` |
| **标注员** | 同采集员（功能权限一致；数据范围见下表） |
| **游客** | `dashboard.view`；`dataset.self/open` 的 **view**；`tag.view`；`device.view`（无 `collection.*`、无下载） |
| **工程师** | `dashboard.view`；`dataset.self/open` 的 view + download；`tag.view`；`device.view`（无 `collection.*`） |

自定义角色通过 **角色管理** 页（`/system/role`）新建，初始 `permissions: []`，需手动「编辑权限」。

### 权限生效范围

| 层级 | 行为 | 实现位置 |
|---|---|---|
| 侧边栏 | 无 view 的菜单/子菜单隐藏；父级无可见子项则整组隐藏 | `Sidebar.jsx` |
| 路由 | 直链访问无 view 权限 → `NoPermission` 占位页 | `PermissionGuard.jsx` + `ROUTE_VIEW_PERMISSION` |
| 顶部/全局操作 | 无权限 → **不渲染**（如「+ 新建项目」、侧边栏入口） | `PermButton` / `IfPerm`（`mode="hide"` 默认） |
| 行内/卡片/详情操作 | 无权限 → **置灰 + Tooltip**「暂无操作权限，请联系管理员分配」 | `PermButton` / `PermAction` / `PermMenuItem`（`mode="disable"`） |
| 数据范围 | 按角色过滤项目/任务/上传/条目 | `permissions.js` 数据范围 helper |

**已接入按钮级权限的页面**（`PermissionAction.jsx`）：

| 页面 | 受控操作 |
|---|---|
| 采集项目 | 新建项目；卡片/列表：创建任务、编辑、归档、删除 |
| 项目详情 | 采标方案（采集/质检/布局）、采集任务、项目人员各 Tab 操作 |
| 采集任务 | 新建任务；行内：复制、编辑、发布、审核、验收、导出、归档、删除 |
| 上传记录 | 下载、删除 |
| 真机数据集 | 新建、编辑、删除、下载；卡片菜单编辑/删除 |
| 真机数据集详情 | 更新数据集 |
| 开源数据集 | 导入、下载 |
| 标签管理 | 各 Tab 新建；行内编辑、删除 |
| 设备管理 | 新建类型/实例；行内编辑、删除 |
| 用户管理 | 新增用户、编辑用户 |
| 角色管理 | 新建角色、编辑权限 |
| 系统日志 | 导出日志（占位 Toast，未接 `system.log.export` 权限校验） |

> **运营看板**：当前仍为全量 mock 数据，不随项目成员数据范围收缩（已知临时差异）。

### 数据范围

基于 `misc.js` → `projectMembers`（项目人员 Tab 配置）：

| 角色 | 项目列表 | 任务列表 | 任务详情条目 | 上传记录 |
|---|---|---|---|---|
| **管理员** | 全部 | 全部 | 全部 | 全部 |
| **平台运营** | 本人担任 **平台运营** 的项目 | 上述项目下全部任务 | 上述任务下全部条目 | 上述任务关联上传 |
| **采集员** | 本人担任 **采集员** 的项目 | `taskIds` 分配的任务 | **仅本人上传**（`uploader === 昵称`） | 仅本人上传 |
| **标注员** | 本人担任 **标注员** 的项目 | `taskIds` 分配的任务 | 分配任务下 **全部条目** | 分配任务关联上传 |
| **游客 / 工程师** | 无 `collection.*` 路由权限 | — | — | — |

进入任务详情前校验 `canAccessTask`；进入项目详情前校验 `canAccessProject`。无权限时显示 `NoPermission`（与路由 view 权限独立）。

### 编辑权限弹窗

`RolePermissionModal`：树形模块 + 操作 checkbox 矩阵；支持模块级全选/半选；保存写入 `rbac.js` 运行时 store，**刷新页面恢复 preset**。

### 创建人自动填充

新建类弹窗通过 `FormField.jsx` → `CreatorReadonlyField` 展示只读「创建人」，取值 `AuthContext.useCurrentNickname()`（**昵称**，如张华/李明），**随顶栏演示身份切换实时更新**；提交保存时各页面在 handler 内再次读取当前昵称写入 `creator` 字段。

| 页面 / 弹窗 | 说明 |
|---|---|
| 采集项目 · 新建项目 | `Project/index.jsx` |
| 真机数据集 · 新建数据集 | `CreateDatasetModal.jsx` |
| 标签管理 · 平铺标签新建 | `Tag/index.jsx` → `TagModal` |
| 标签管理 · 场景类型新建 | `SceneTypeModal.jsx` |
| 设备管理 · 新建类型 | `Device/TypeList.jsx` |

> 标签/设备新建弹窗内展示 `CreatorReadonlyField`；编辑模式不展示。历史 mock 数据中的 `creator` 字段不受演示切换影响，仅本次会话新建记录使用当前身份。

---

## 功能模块总览

### 登录页 `/login`
- 全屏深色背景 + 3 个动态光晕装饰
- 双 Tab 登录：账号密码登录（邮箱 + 密码 + 记住我）、飞书 SSO 登录
- 密码可见/隐藏切换，登录后跳转 `/dashboard`

---

### 运营看板 `/dashboard`
顶部三个 Tab：

| Tab | 主要内容 |
|---|---|
| 全部数据 | 6 张指标卡、数据资产构成 + 层级占比环形图、资产增长双线图、时长分布柱状图、场景分布环形图 + 操作技能英文词云 |
| 真机数据 | 8 张指标卡、**进行中任务进度** / **绩效排行榜**（上下全宽表格，见下文）、每日采集量柱状图（近 7/30 日）、数据时长分布、4 个分布环形图 |
| 开源数据 | 5 张指标卡、层级占比环形图、最新入库动态列表 |

#### 真机数据 Tab 详情（`RealDataTab.jsx`）

**项目筛选**（全局看板）：
- 顶部「所属项目」下拉：全部项目 / 各采集项目（`projects.js`）
- 选中单项目后显示「清除筛选」链接
- 组件支持 `fixedProjectId` prop：传入后锁定项目、隐藏筛选器（当前仅运营看板使用，未传该 prop；可供项目详情等页面复用）

**8 张指标卡**（紧凑双行布局，前两卡含条数 + 小时副值）：

| 指标 | 数据来源 / 联动规则 |
|---|---|
| 采集数据量 | `realDashboard[projectId].metrics.collectCount` + `collectHours` |
| 审核通过量 | `reviewCount` + `reviewHours` |
| 采集项目数 | 全部项目 → `projects.length`（8）；单项目 → `1` |
| 采集任务量 | `metrics.tasks`（如全部 15、P-1003 为 3） |
| 操作技能 | `metrics.skills` |
| 采集设备 | `metrics.devices` |
| 负责人员 | `metrics.members`（项目成员规模 mock） |
| 总存储量 | `metrics.storage` |

筛选切换时，除「采集项目数」按上表规则计算外，其余指标均读取 `dashboard.js` → `realDashboard` 中对应 key（`all` 或 `P-1001`~`P-1008`）的 mock 数据；下方任务进度、排行榜、每日采集量、时长分布、4 个环形图同步切换。

**布局**：「进行中任务进度」与「绩效排行榜」**上下排列**，各占整行宽度（非左右并排）。

#### 进行中任务进度（`RealDataTab` → `OngoingTaskSection`）

- **标题** + 右上角胶囊切换：**采集任务** / **标注任务**
- 数据来源：按当前筛选项目过滤 `tasks.js` 中 **已发布** 任务
  - **采集任务**：`collectDone < collectTotal`
  - **标注任务**：`collectDone > 0` 且 `reviewDone < collectDone`（可标注量 = 已采集条数）
- **表格列**：
  - **采集任务**：任务 ID/名称（名称粗体、ID 小字在下）、采集员、采集量/计划量、进度百分比
  - **标注任务**：任务 ID/名称、标注员、标注量/可标注量、进度百分比
- **进度列**：蓝色进度条 + 两位小数百分比；**100%** 时变绿并显示对勾图标
- **分页与滚动**：**10 条/页**，底部分页换页；表格区域固定可见 **5 行** 高度（表头 sticky），当前页超出部分在表格内滚动

#### 绩效排行榜（`RealDataTab` → `RankingSection`）

- **标题** + 右上角胶囊切换：**采集员** / **标注员**（已移除设备页签）
- 数据来源：`realDashboard[projectId].ranking`；全局 `allRanking` 各 12 条，单项目为精简 `ranking`；缺省字段由 `enrichRankingList` 按口径推算
- **表格列**：排名、人员、完成数量、**完成时长（小时）**、**驳回数量**、**驳回时长（小时）**、完成进度
- **字段口径（mock）**：
  - **采集员**：完成时长 = 上传条目时长之和；驳回数量/驳回时长 = **审核驳回**条目数/时长之和
  - **标注员**：完成时长 = 审核条目时长之和；驳回数量/驳回时长 = **验收驳回**条目数/时长之和
- **排名样式**：第 1~3 名金/银/铜圆形徽章；第 4 名起 `NO.N` 灰色标签
- **完成进度**：进度条 + 百分比，100% 变绿带对勾
- **分页与滚动**：**10 条/页**；表格区域固定可见 **6 行** 高度，当前页超出部分滚动

---

### 采集项目 `/collection/project`
- **视图切换**：卡片视图（默认，4 列）/ 列表视图
- **筛选区**（点击「查询」生效）：项目 ID、项目名称、项目状态、创建人、创建时间范围；筛选项单行铺满，「重置」「查询」次行右对齐
- **标题栏**：「项目列表」+ 视图切换按钮 + 「+ 新建项目」
- **新建项目弹窗**：自动生成项目 ID（只读）、项目名称（必填）、**创建人**（只读，随演示身份）、项目描述
- **卡片/列表字段**：项目 ID、名称、场景、任务数、创建人、描述、采集进度条（蓝色/绿色，100% 变绿）、状态 badge、创建/更新时间
- **操作**：查看详情、创建任务、编辑、归档/取消归档、删除（需二次确认输入项目名）
- **状态**：未开始（灰）/ 进行中（蓝）/ 已完成（绿）/ 已归档（灰）

> 项目 mock 数据仍保留 `type`（正式/测试）字段，**列表与详情 UI 已不再展示项目类型**。

---

### 项目详情 `/collection/project/:id`
顶部紧凑头部（项目名称 + 描述 + 元信息横排）+ **3 个 Tab**（样式与真机数据集详情 Tab 一致）：

| Tab | 内容 |
|---|---|
| 采集任务 | 复用 `Task/index.jsx`（`fixedProjectId` 锁定当前项目，隐藏「所属项目」筛选列，含筛选区 + `TaskTable` + 「+ 新建任务」） |
| 采标方案 | 内含 **3 个二级 Tab**（胶囊样式，见下文） |
| 项目人员 | 成员列表 + 添加/编辑成员弹窗（见下文） |

#### 采标方案 → 二级 Tab

| 二级 Tab | 组件 | 内容 |
|---|---|---|
| 采集方案 | `CollectConfigTab` | 采集方案 CRUD、状态机、标注方案只读弹窗（见下文） |
| 质检配置 | `QcTab` | 固定质检项列表，开关启停 + 规则说明编辑（见下文） |
| 播放布局 | `LayoutTab` | 系统默认布局 + 项目自建布局；新建/编辑/下载/删除 |

> **标注方案**不再作为独立 Tab。标注配置由采集方案步骤自动生成，在采集方案列表操作栏通过「标注方案」按钮只读查看（`PlanAnnotationDetails`）。

#### 采集方案子 Tab（`CollectConfigTab` + `CollectPlanForm.jsx`）

**状态机**（两态）：`草稿`（灰 badge）/ `已发布`（蓝 badge）。新建方案直接 **已发布**；复制生成 **草稿**（名称 `{原名}_副本{方案ID}`，`taskCount: 0`）。

**列表字段**：方案 ID、方案名称、本体类型（`robotBody` 展示名）、采集方式、步骤数、状态

**操作栏按状态**：

| 状态 | 操作 |
|---|---|
| 草稿 | 复制图标（hover「创建副本」）· **标注方案** · 编辑 · 发布 · 删除 |
| 已发布 | 复制图标 · **标注方案** · 查看 · 删除 |

- **复制**：图标按钮，生成草稿副本，其余字段同原方案
- **编辑**：仅草稿可编辑；已发布需先复制为草稿
- **发布 / 删除**：二次确认弹窗
- **标注方案**：只读弹窗，按步骤展示自动生成的标注配置（见下）
- **查看**（已发布）：只读采集方案详情（`PlanReadonlyDetails`）

**新建/编辑弹窗**（`fitViewport`，与新建任务「创建新方案」字段对齐，共用 `CollectPlanFormFields`）：
- 方案名称（必填）；编辑态方案 ID 只读
- 所属场景（三级级联，必填）
- 本体类型（下拉，必填）+ 只读解析：本体机型 / 左末端 / 右末端（未选显示「—」）
- 采集方式（下拉，必填；选项来自 `collectionMethodTags`）
- 原始场景状态（文本域 0/500）
- 采集步骤：默认 1 步；每步含步骤描述、原子技能（多选 portal 下拉）、时长(秒)；≥2 步才可删；步骤可留空
- 总时长（自动累加）· 总偏差 · 目标时间范围（总时长 ± 总偏差）
- 标注管理：「基于采集方案生成标注配置」「基于采集方案预标注」两个勾选
- **不含**指定采集设备（设备在任务级选择）

**标注方案只读弹窗**（列表「标注方案」按钮）：
- 顶部说明：「由采集方案步骤自动生成」
- 按有效步骤列表：动作语义（类别）｜ 步骤描述（属性）｜ 技能标签（原子技能，多 Badge）｜ 时长
- 若两个标注开关均未勾选：提示「该方案未启用标注配置生成」

**运行时 API**（`plans.js`）：`getPlansByProjectId`、`appendPlan`、`updatePlanInStore`、`deletePlanFromStore`、`publishPlanInStore`、`copyPlanInStore`、`resolvePlanDeviceTypeId`

#### 质检配置子 Tab（`QcTab`）

对齐旧平台质检方案：**不支持新建质检项**（每项目固定 6 条模板）。

**筛选区**（点「查询」生效）：质检项名称、质检项类型（完整性/一致性/有效性）、**开启状态**（开启/关闭）；重置/查询

**列表标题**：「质检方案配置」。列：质检项名称、质检项类型（Badge）、质检规则说明、开启状态（Toggle）、操作（查看/编辑）

**右上**：导入、导出（Toast 占位）

**固定质检项**（每项目 6 条）：可解析性检查、非零文件大小检查、时间戳记录非空检查、帧率完整性检查、全模态帧数一致性检查、持续时长范围检查

**查看弹窗**「查看质检规则」：质检项名称、类型、规则说明 — 全只读

**编辑弹窗**「编辑质检规则」：名称/类型只读，仅 **质检规则说明** 可编辑

**运行时 API**：`getQcItemsByProjectId`、`updateQcItemInStore`

#### 播放布局子 Tab（`LayoutTab`）

**列表**（每项目首行固定 **默认布局**，自建布局排在下方、序号顺延）：

| 行类型 | 布局名称 | 添加日期 | 描述 | 操作 |
|---|---|---|---|---|
| 系统内置 | 默认布局 | 灰 badge「系统内置」 | 头部/胸部/左右腕相机 + 左右臂关节·末端位姿·夹爪曲线 | 仅 **下载** |
| 自建 | 用户命名（如 P-1001「四宫格布局」） | 创建日期 | 用户填写 | 编辑 · 下载 · 删除 |

- **默认布局**：UI 固定项（`plans.js` → `buildDefaultPlayLayoutRow`），不可编辑/删除
- **下载**：Toast「布局文件已导出」（占位）

**新建弹窗**（仅新建，非编辑）：
- 布局名称（必填）
- **布局文件**（必填）：虚线框拖拽/点击上传；文案「点击或拖拽文件到此区域上传」；副文案「支持 JSON 格式，文件大小不超过 10MB」；选中后显示文件名可移除；纯前端 mock，不解析文件
- 布局描述（选填）

**编辑弹窗**：可修改布局名称与描述（不含布局文件；日期不变）

#### 项目人员 Tab
- **成员列表**：姓名、角色（多 badge）、负责任务（多标签，过多截断 + tooltip）、**加入时间**（`YYYY-MM-DD HH:mm:ss`）、操作（编辑/移除，二次确认移除）
- 项目创建人固定显示为「平台运营」，置于首行，不可编辑/移除；加入时间取项目 `createdAt`
- **添加成员弹窗**（字段顺序）：
  1. **角色**（必选，可多选）：采集员 / 标注员
  2. **选择用户**（必选）：下拉选人，**仅显示姓名**（不含角色后缀）；列出启用用户，排除创建人与已在项目中的成员；本版不做按角色严格过滤
  3. **分配任务**：项目任务多选勾选列表
- **编辑弹窗**：同上顺序；用户字段只读，角色与任务可改

---

### 新建/编辑任务弹窗（`CreateTaskModal`，项目任务 Tab 共用）

**布局**：`fitViewport` 宽弹窗（960px），左右双栏 — 左「基础信息 + 审核布局」，右「采集方案」。

**模式**：
- **新建**：右侧可在「创建新方案 / 选择已有方案」间切换（`ModeToggle`）
- **编辑**（`editTask`）：左侧任务字段可改；右侧只读展示关联方案（`PlanReadonlyDetails`），不可切换方案

**左侧 · 基础信息**：
- 任务名称（必填；前缀只读任务 ID）
- 任务用途（必填；正式采集 / 试采集，来自 `taskTypeTags`）
- 采集条数（必填，≥1）
- 指定采集设备（必填；按当前方案本体类型 `deviceTypeId` 过滤在库实例 SN；未配置本体类型时禁用并提示「请先配置采集方案的本体类型」）

**左侧 · 审核布局**：布局配置（选填，默认布局；选项来自当前项目 `playLayouts`）

**右侧 · 采集方案**（新建时必选）：
- **选择已有方案**：可搜索下拉（方案 ID · 名称）；选中后下方 `PlanReadonlySection` 摘要
- **创建新方案**：嵌入 `CollectPlanFormFields`（与项目详情采集方案弹窗字段一致）；保存时 `appendPlan`，新方案状态 **已发布**

**保存**：新建任务默认状态 **草稿**；校验任务字段 + 方案来源（创建新方案走 `validatePlanForm`）。

---

### 采集任务 `/collection/task`
- **数据范围**：列表经 `filterTasksByDataScope` 过滤（采集员/标注员仅见相关任务）
- **筛选区**（点击「查询」生效）：所属项目、任务 ID（文本搜索）、任务名称（文本搜索）、任务状态、采集员（包含匹配）、标注员（包含匹配）；筛选项左侧均匀拉伸，「重置」「查询」固定右侧
- **任务状态**：**草稿**（灰）/ **已发布**（蓝）/ **已归档**（灰）
- **列表字段**：任务 ID、任务名称、任务用途、采集设备、采集方案 ID、所属场景、采集方式、采集员（多人首名 + `+N` pill）、标注员、状态、采集/审核/验收进度、总数据量、创建人、创建/更新时间
- **操作栏按状态**（`TaskTable.jsx`；含复制图标「创建副本」）：

| 状态 | 操作 |
|---|---|
| 草稿 | 复制 · 编辑（`CreateTaskModal`）· 发布（二次确认）· 删除 |
| 已发布 | 复制 · 查看详情 · 审核 · 验收 · 导出（标签/质检报告 Toast）· 归档（二次确认）· 删除 |
| 已归档 | 复制 · 查看详情 · 删除 |

- **编辑弹窗**：可改任务名称、用途、采集条数、设备实例、审核布局；关联采标方案只读
- **删除**：需输入任务名二次确认

---

### 任务详情 `/collection/task/:id`
进入前校验 `canAccessTask`：采集员/标注员访问非本人任务时显示 `NoPermission`（与路由 view 权限独立）。

顶部展示任务名称、状态、采集/审核进度、采集员/标注员（多人逗号分隔）。**2 个 Tab**：

| Tab | 内容 |
|---|---|
| 采集条目 | 筛选区（点击「查询」生效）+ 条目列表 |
| 任务信息 | 纯只读网格展示任务字段（含本体类型 `robotBody`） |

#### 采集条目列表字段
条目 ID、文件名、文件大小、时长、上传时间、上传人、数据状态（badge）、数据格式（h5/LeRobot badge 居中）、操作

**数据状态**（6 值，`entries.js` → `DATA_STATUSES`）：

| 状态 | badge 颜色 | 说明 |
|---|---|---|
| 已上传 | gray | 刚上传，解析中 |
| 已解析 | blue | 可进入审核 |
| 审核不通过 | red | 审核驳回，可重新审核 |
| 已审核 | purple | 审核通过，可进入验收 |
| 验收不通过 | orange | 验收驳回，可重新验收 |
| 已验收 | cyan | 流程结束 |

**筛选**：条目 ID、文件名、上传人、数据状态、数据格式；点击「查询」生效。

**操作栏**（`EntryActions.jsx`）：固定 4 列 `[ 播放 | 中间按钮 | 下载 | 删除 ]`

| 数据状态 | 播放 | 中间按钮 | 下载 | 删除 |
|---|---|---|---|---|
| 已上传 | 打开工作台 `mode=play` | 审核（置灰，解析中） | 占位 | 二次确认 |
| 已解析 / 审核不通过 | 播放 | **审核** → `mode=review` | 占位 | 二次确认 |
| 已审核 / 验收不通过 | 播放 | **验收** → `mode=accept` | 占位 | 二次确认 |
| 已验收 | 播放 | 占位 | 占位 | 二次确认 |

播放/审核/验收均在新标签页打开 `/review/:entryId?mode=play|review|accept`；删除需输入文件名二次确认。上传记录页复用同一 `EntryActions` 组件。

> **TODO**：中间按钮角色校验（审核=标注员、验收=平台运营）尚未接入。

---

### 审核工作台 `/review/:entryId?mode=play|review|accept`
独立全屏页面（无 AppLayout），需 `collection.task.view` 路由权限。

**模式**（URL query `mode`，默认 `play`）：

| mode | 右侧面板标题 | 可编辑内容 |
|---|---|---|
| `play` | 播放 | 只读；审核/验收区显示「待审核/待验收」占位 |
| `review` | 审核标注 | 审核结论（通过/不通过）、审核标签（多选）、审核意见；时间轴动作段可编辑 |
| `accept` | 验收 | 验收结论（通过/不通过）、验收意见 |

**布局**：
- **顶栏**：返回、文件名、上一条/下一条（蓝色描边按钮）、右侧面板折叠、布局设置（占位）
- **左侧主区**（撑满高度）：
  - 上区（约 3:1 高度比）：相机行（头部 2 份 + 胸/左腕/右腕 1 份 + URDF 1 份）+ 信号图行（关节 / 末端位姿 / 夹爪，recharts 折线图）
  - 下区：时间轴（播放/暂停、倍速、帧 scrubber、动作段与区域段；`review` 模式可编辑动作段）
- **右侧面板**（340px，可折叠）：基本信息 / 审核结论 / 验收结论 / 可展开「采集方案详情」
- **提交**：审核提交 → 更新 `dataStatus` 为「已审核」或「审核不通过」；验收提交 → 「已验收」或「验收不通过」；提交后自动跳转同任务下一条，末条则回任务详情

**可视化 mock**：`src/assets/review/` 真实占位图（头/胸/腕相机、URDF）；信号数据由 `mock/signalData.js` 生成；播放头仅驱动信号图与时间轴。

**快捷键**：空格键切换播放/暂停（输入框/文本域内不触发）。

---

### 上传记录 `/collection/upload`
- **数据范围**：采集员见本人上传；标注员见 `reviewer` 含本人的任务关联上传；管理员/平台运营/工程师见全部
- **SDK 说明折叠区块**（筛选区上方）：默认折叠，点击展开 Python SDK 上传代码示例
- **筛选区**（点击「查询」生效）：条目 ID、文件名、所属任务、所属项目、上传人、数据状态、数据格式；「重置」清空
- **列表字段**：条目 ID、文件名、所属任务、所属项目、文件大小、时长、上传时间、上传人、数据状态（badge）、数据格式（badge）、操作（`EntryActions` 四列操作栏）
- 数据与采集条目 mock 对齐，文件名不含 `.mcap` 后缀，格式在「数据格式」列展示

---

### 真机数据集 `/dataset/self`
侧边栏显示为「真机数据集」（路由不变）。

#### 列表页
- **默认视图**：卡片视图（4 列，紧凑字号）；可切换列表视图
- **筛选区**（点击「查询」生效，单行布局）：数据集名称、最后更新人、最后更新时间范围在左侧 `flex-1 basis-0` 均匀拉伸；「重置」「查询」固定右侧；「重置」清空
- **标题栏**：
  - 左侧：「数据集列表」+ **下载数据集**（跳转下载说明页，与右侧按钮分开）
  - 右侧：视图切换 + 「+ 新建数据集」
- **列表/卡片字段**：数据集 ID、名称、轨迹数量、总数据量、最后更新人、最后更新时间
- **操作**：查看详情、编辑（仅改名称）、删除（输入名称二次确认）
- **卡片**：右上角三点菜单（查看详情/编辑/删除），点击卡片主体跳转详情

#### 数据集下载说明 `/dataset/self/download`
- **面包屑**：数据集管理 / 真机数据集 / 下载数据集
- **顶部按钮**：下载 SDK、查看访问密钥（Toast 占位，无真实功能）
- **示例代码区**：顶部标注「示例代码，以实际 SDK 为准」；CLI、SDK 两栏并排，各带复制按钮与深色代码块

#### 新建数据集弹窗（`CreateDatasetModal`）
单弹窗、三个区块（非分步向导），启用 `fitViewport`（限高 85vh、垂直居中、内容区滚动、底部按钮固定）：

| 区块 | 内容 |
|---|---|
| 基本信息 | **创建人**（只读，随演示身份）、数据集名称（必填）、描述（选填） |
| 选择数据来源 | 来源项目（单选，不跨项目）、纳入任务（多选 + 全选，默认不勾选）、纳入数据状态（多选，默认不勾选）、数据格式（h5/LeRobot 多选，默认不勾选，必填） |
| 预览 | 按「任务 + 数据状态 + 数据格式」实时计算符合条件的条目数与预计总数据量 |

- 纳入数据状态选项：**已上传 / 已解析 / 已审核**（与当前条目主流程对齐）
- 创建为**快照式**：按当前条件固定纳入条目，后续项目新增数据不自动加入
- 创建后写入：`taskIds`、`statuses`、`formats`、`entryIds`、`trajCount`、`totalSize`、`totalDuration`、创建人/时间、最后更新人/时间、首条「创建」更新记录

#### 详情页 `/dataset/self/:id`
参考项目详情页的紧凑头部 + Tab 布局（默认 Tab：**数据概览**）：

**头部**（非表格，紧凑横排）：
- 大标题：数据集名称；副文字：描述（无则显示「暂无描述」）
- 元信息一行平铺（label 小字在上、值在下）：数据集 ID、轨迹数量、总数据量、轨迹总时长、创建人、创建时间、最后更新人、最后更新时间
- Tab 栏接在头部下方（数据概览 / 数据条目 / 更新记录）

| Tab | 内容 |
|---|---|
| 数据概览 | 来源项目、已绑定任务数与总纳入条数；各任务纳入条目表格；数据状态/格式**横向堆叠占比条**（分段颜色 + 数量 + 百分比） |
| 数据条目 | 数据集 `entryIds` 关联的全部条目列表；筛选（所属任务/数据状态/格式，点查询）；操作：播放、下载、导出（占位）；**分页每页 10 条** |
| 更新记录 | 更新记录表格 + 「更新数据集」按钮；字段：更新时间、更新人、操作类型、客观变更、更新说明 |

#### 更新数据集弹窗（`UpdateDatasetModal`）
与新建弹窗同源 `fitViewport` 限高处理：

- 来源项目只读
- **纳入任务**：已绑定任务默认勾选，名称旁显示「已纳入」标签；取消勾选移除该任务数据，新勾选按条件追加
- 纳入数据状态、数据格式（多选，打开时预填当前数据集条件，必填）
- **预览**：实时对比当前与目标集合，分开展示新增/移除条目数与数据量，以及更新后预计总量
- **更新说明**（必填）；无数据变更时拦截提交
- 确认后：重写 `entryIds` 与绑定条件，更新指标与最后更新人/时间，写入「更新数据」记录（客观变更含追加/移除条数与容量）

---

### 开源数据集 `/dataset/open`
侧边栏显示为「开源数据集」。数据集导入后即视为可用，**无入库状态**字段或中间态。

#### 列表页
- **默认视图**：卡片视图（4 列）；可切换列表视图
- **筛选区**（点击「查询」生效，单行布局）：数据集名称、发布方、层级（L1~L4）在左侧均匀拉伸；「重置」「查询」固定右侧
- **标题栏**：
  - 左侧：「开源数据集列表」+ **下载数据集**（跳转 `/dataset/open/download`，需 `dataset.open.download`）
  - 右侧：视图切换 + **导入数据集**（需 `dataset.open.import`）
- **列表/卡片展示字段**：ID、数据集名称、发布方、层级（badge：L1 紫 / L2 蓝 / L3 青 / L4 橙）、数据量、轨迹数量  
  - **不展示** `description`（描述仅在详情页显示）
- **表格视图交互**：
  - **ID**：纯文本，不可点击
  - **数据集名称**：蓝色加粗可点击，跳转详情页 `/dataset/open/:id/usage`
  - 名称右侧 **chain-link 外链图标**（蓝色 `text-blue-600`，悬浮加深/下划线）：点击 `stopPropagation`，新标签页打开 `externalLink`；无操作列
- **卡片视图交互**：
  - 整张卡片可点击跳转详情（hover 上浮，参考真机数据集卡片）
  - 标题右侧外链图标：点击阻止冒泡，单独打开原始链接
  - 卡片字段：名称 + 层级 badge（右上）、ID、发布方、数据量/轨迹数量双列数据块

#### 导入数据集弹窗（`ImportOpenDatasetModal`）
三步流程，启用 `fitViewport`：

| 步骤 | 内容 |
|---|---|
| 1. 下载模板 | 「下载导入模板」生成 Excel（列：数据集名称、发布方、层级、外部链接、数据量、轨迹数量、描述） |
| 2. 上传解析 | 拖拽/点击上传 `.xlsx` / `.xls`，使用 **SheetJS（`xlsx`）** 真实解析，非假动作 |
| 3. 预览确认 | 表格预览解析结果；必填项（名称/发布方/层级/数据量）或层级非法（非 L1~L4）标红；无效行默认不勾选；顶部「共解析 X 条，有效 Y 条」 |

- **确认导入**：仅导入已勾选且校验通过的行；ID 从现有最大 `ODS-0XX` 续号；记录插入列表最前；Toast「成功导入 Y 条数据集」
- 导入记录字段：`name`、`publisher`、`level`、`dataSize`、`trajCount`、`size`（合并展示串）、`externalLink`、`description`、`createdAt`

#### 数据集下载说明 `/dataset/open/download`
- **面包屑**：数据集管理 / 开源数据集 / 下载数据集
- **顶部**：标题「开源数据集下载说明」+ 下载 SDK / 查看访问密钥（Toast 占位）
- **示例代码区**：CLI、SDK 两栏并排，各带复制按钮与深色代码块（示例针对开源数据集 CLI/SDK）

#### 数据集详情 `/dataset/open/:id/usage`
- **面包屑**：数据集管理 / 开源数据集 / **数据集详情**
- **头部卡片**（元素顺序）：
  1. 数据集名称（大标题）+ 右侧「下载 SDK」（Toast 占位）
  2. `ID · 发布方`（灰色副标题小字）
  3. 描述（`description`，无则「暂无描述」）
  4. 元信息横排（label 小字在上、值在下）：层级 badge、数据量、轨迹数量、原始数据集链接（可点击，新标签页）
  5. 「示例代码，以实际 SDK 为准」（琥珀色提示）
- **下方代码区**：CLI、SDK **对称两栏**并排（等宽、顶对齐），各带复制按钮与深色代码块；示例代码按当前数据集 ID/层级动态生成

---

### 标签管理 `/tag`
页面标题「标签管理」，**两个一级 Tab**（蓝色下划线）+ 若干二级 Tab（圆角药丸样式）。

> **标注模板**（`misc.js` → `annotationTemplates`）为历史 mock，**当前 UI 不再使用独立标注方案 Tab**。标注配置由采集方案步骤自动生成，在项目详情 → 采标方案 → 采集方案列表通过「标注方案」只读弹窗查看（`CollectPlanForm` → `PlanAnnotationDetails`）。

#### 采集标签（4 个二级 Tab）

| 二级 Tab | 组件 | 数据 |
|---|---|---|
| 任务类型 | `TagSubPanel` | `tags.js` → `taskTypeTags`（正式/试采） |
| 场景类型 | `SceneTypePanel` | `tags.js` → `sceneTypeTree`（三层树，见下文） |
| 采集方案 | `TagSubPanel` | `tags.js` → `collectionMethodTags`（**VR遥操 / 外骨骼**，与采标方案采集方式措辞一致） |
| 原子技能 | `TagSubPanel` | `tags.js` → `atomicSkillTags`（close/open/press/grasp/push/pull/move） |

#### 设备标签（4 个二级 Tab）

| 二级 Tab | 数据 key | 初始条目（`tags.js`） |
|---|---|---|
| 本体类型 | `deviceTagGroups.bodyType` | AlphaBot2、AlphaBotX |
| 末端类型 | `deviceTagGroups.endType` | 因时·RH56DFX 灵巧手、因时·RH56BFX 灵巧手、因时·EG2-4B 夹爪、因时·EG2-4C 夹爪 |
| 相机类型 | `deviceTagGroups.cameraType` | RGB相机、深度相机 |
| 雷达类型 | `deviceTagGroups.lidarType` | 激光雷达 |

> 设备类型新建弹窗的本体/末端下拉选项**直接读取** `bodyTypeTags` / `endTypeTags` 的 `name` 字段，与设备标签 Tab 保持同名；但两侧 CRUD 状态独立（标签页修改不会自动同步到 `devices.js` 已有类型记录）。

#### 平铺标签子 Tab 通用交互（`TagSubPanel` + `TagModal` + `TagTableActions`）
- **筛选**：名称搜索 + 重置/查询，点击「查询」生效
- **列表字段**：标签名称、描述、创建人、创建时间、最后更新、操作（编辑/删除，`text-sm` 与表格其他列一致）
- **新建/编辑弹窗**（`TagModal`）：
  - 标题：新建标签 / 编辑标签
  - 字段：标签名称（必填）、描述（选填）
  - **新建时展示只读「创建人」**（`CreatorReadonlyField`，随演示身份）；编辑时不展示
  - 编辑保存：创建人、创建时间不变，仅更新「最后更新」
- **删除**：`useTagRowActions` 统一二次确认弹窗——「确定删除该标签吗？删除后不可恢复」

#### 场景类型子 Tab（`SceneTypePanel` + `SceneTypeModal`）
独立实现，不走 `TagSubPanel`。

- **数据结构**：三层树——一级场景 → 二级子场景 → 三级标签（`sceneTypeTree`）
- **列表展示**：默认仅展开一级；`+/−` 按钮展开/收起子级；缩进区分层级
- **描述列**：仅一级场景显示描述，二/三级显示「—」
- **操作列**：仅一级场景有编辑/删除（红色删除文字）；二/三级无操作
- **新建/编辑弹窗**（`SceneTypeModal`）：
  - 一级：场景名称 + 描述
  - 嵌套编辑子场景与三级标签；确定时强校验非空
  - **新建时展示只读「创建人」**；保存时仅新增或**名称变更**的二/三级更新 `updatedAt`
- **删除**：级联提示——同时删除 N 个子场景和 M 个标签

---

### 设备管理 `/device`
**设备实例**与**设备类型**两个一级 Tab 平铺于同一页面（`Device/index.jsx`），默认 Tab 为「设备实例」。旧路由 `/device/:typeId` 重定向至 `/device`。

#### 设备实例 Tab（`InstanceList.jsx`）

**顶部看板**（一行，左 1/4 + 右 3/4）：
- **左侧**：三个统计卡横排（内容居中）——设备总数 / 在线 / 离线
- **右侧**：**设备类型占比**堆叠条形图——横向色带按各类型实例数量占比分段；图例格式 `类型名 · XX%`（`Math.round` 取整，各段合计 100%）

**筛选区**（点击「查询」生效）：所属类型、状态、实例编号、SN；左侧四列均匀拉伸，「重置」「查询」固定右侧

**列表字段**：实例编号、SN、所属类型、在线状态（圆点 badge）、电量（电池图标 + 百分比；&lt;20% 红色，无「低电」文字）、创建时间、更新时间、操作

**操作**：查看详情、编辑、删除

##### 新建/编辑实例弹窗
| 字段 | 新建 | 编辑 |
|---|---|---|
| 所属类型 | 下拉选择（必选） | 只读 |
| 实例编号 | 只读自动生成 | 只读 |
| SN | 必填 | 必填 |
| 设备描述 | 选填 | 选填 |

- **实例编号规则**：新建 `DEV-` + 全局三位递增（`DEV-001` 起）；历史字母编号（`DEV-A01` 等）不参与递增
- 新建默认：状态「离线」、电量 100%；写入 `createdAt` / `updatedAt` 到秒
- **列表不展示**设备描述；详情弹窗展示

##### 查看详情弹窗
展示：实例编号、SN、所属类型、在线状态、电量、设备描述、创建时间、更新时间

#### 设备类型 Tab（`TypeList.jsx`）

**筛选区**（点击「查询」生效）：本体、类型名称、左末端类型、右末端类型；左侧四列均匀拉伸，「重置」「查询」固定右侧

**下拉选项来源**：本体 ← `bodyTypeTags`；左/右末端 ← `endTypeTags`

**列表字段**：类型名称、本体、左末端类型、右末端类型、URDF、实例数量、**类型描述**、创建人、创建时间、更新时间、操作

**操作**：编辑、删除（**无「查看实例」**，**类型名称不可点击跳转**）

**新建/编辑类型弹窗**：
- **类型名称**：必填手动输入；提交时校验重名（`isDeviceTypeNameTaken`）
- 名称下方灰色参考预览：`参考：{本体}·{左末端}+{右末端}`（`buildTypeNameReference`）
- **新建**：本体 / 左末端 / 右末端 / URDF 可填（URDF 选填）；展示只读「创建人」
- **编辑**：本体、左末端、右末端、URDF **只读锁定**；仅类型名称、描述可改
- 创建时间、更新时间精确到 `YYYY-MM-DD HH:mm:ss`

**删除类型**：二次确认；若该类型下有实例，提示级联删除的实例数量

#### 与标签管理的数据关系

| 维度 | 设备管理 `devices.js` | 标签管理 `tags.js` |
|---|---|---|
| 本体选项 | 新建类型下拉读 `bodyTypeTags.name` | `bodyTypeTags` CRUD |
| 末端选项 | 新建类型下拉读 `endTypeTags.name` | `endTypeTags` CRUD |
| 实体数据 | 设备类型 + 实例的运行时 store | 标签字典（各 Tab 独立 `useState`） |
| 关联 | 无互相 import；选项名称约定保持一致 | 无互相 import |

---

### 系统管理（二级导航）

侧边栏「系统管理」下为三个平级子菜单：**用户管理**、**角色管理**、**系统日志**（`/system` 重定向至 `/system/user`）。

#### 用户管理 `/system/user`
独立页面（`UserManage.jsx`），**无页内 Tab**；页面标题卡片显示「用户管理」，下方为原「用户列表」整块内容（RBAC 详见 [RBAC 权限体系](#rbac-权限体系)）。

- **筛选区**（点击「查询」生效，单行布局）：用户 ID、用户名、昵称、角色、状态在左侧 `flex-1 basis-0` 均匀拉伸；右侧固定「重置」「查询」
- 标题栏：「用户列表」+ 「+ 新增用户」（需 `system.user.create`）
- 新增用户弹窗：用户名、昵称、手机号、角色（管理员/平台运营/采集员/标注员/游客/工程师）、状态（默认启用）
- 用户 ID 格式 `U-001`，按当前列表最大 id 递增自动生成
- 操作：编辑（需 `system.user.edit`；可改昵称、角色、状态）
- **面包屑**：系统管理 / 用户管理

#### 角色管理 `/system/role`
独立页面（`RoleManage.jsx`），由原用户管理页内「角色权限」Tab 整体迁出；页面标题卡片显示「角色管理」。

- **筛选区**：角色名称、角色类型（内置/自定义），**输入即过滤**（实时）
- 标题栏：「角色列表」+ 「+ 新建角色」（需 `system.role.create`）
- 新建角色：ID 自动 `R-00X`、名称/描述必填、类型默认「自定义」、初始无权限（Toast 提示去配置）
- 列：角色 ID、名称、描述、**权限模块数**、**成员数**（按 `misc.js` users 统计）、创建时间、类型 badge
- **编辑权限**（需 `system.role.assignPerm`）：打开 `RolePermissionModal`（树形模块 + 操作矩阵）
- **面包屑**：系统管理 / 角色管理

#### 系统日志 `/system/log`
- **面包屑**：系统管理 / 系统日志
- **筛选区**（点击「查询」生效，单行布局）：
  - 左侧四列均匀拉伸：搜索操作人/详情（关键字）、操作模块、操作类型、操作时间范围（起止 date）
  - 右侧固定「重置」「查询」（带搜索图标）
- **标题栏**：左侧「系统日志」+ 右侧「导出日志」（蓝色主按钮，Toast 占位；未接 `system.log.export` 权限校验）
- **列**：操作时间、操作人、操作模块、操作类型（badge，`logActionColor` 着色）、操作详情（截断 + tooltip）、IP
- **表格**：全部列内容居中（`Table` 组件统一行为）

---

## 目录结构

```
src/
├── assets/
│   ├── logo.png
│   └── review/                # 审核工作台相机/URDF 占位图
├── components/
│   ├── collect/
│   │   └── CollectPlanForm.jsx    # 采集方案表单/只读详情/标注方案只读视图（项目详情与新建任务共用）
│   ├── Layout/
│   │   ├── index.jsx          # 整体布局（Header + Sidebar + 内容区）
│   │   ├── Header.jsx         # 顶栏（演示身份切换 + 退出登录）
│   │   ├── Sidebar.jsx        # 侧边栏（按 RBAC 过滤菜单）
│   │   ├── PermissionGuard.jsx # 路由 view 权限拦截
│   │   └── Breadcrumb.jsx     # 面包屑
│   └── common/
│       ├── Button.jsx         # 按钮（primary / link / linkDanger）
│       ├── Modal.jsx          # 弹窗（支持 fitViewport 视口限高与内容滚动）
│       ├── Table.jsx          # 表格（斑马纹、全列居中；pageSize 分页；scrollVisibleRows 固定可见行数+表内滚动，可与分页组合）
│       ├── Badge.jsx          # 状态标签（多色、dot 模式）
│       ├── Tabs.jsx           # Tab 切换（蓝色下划线）
│       ├── Progress.jsx       # 进度条
│       ├── StatCard.jsx       # 统计指标卡片
│       ├── FormField.jsx      # Input / TextArea / Select；CreatorReadonlyField（创建人只读）
│       ├── PermissionAction.jsx # IfPerm / PermButton / PermAction / PermMenuItem
│       ├── EntryActions.jsx   # 采集条目统一操作栏（播放/审核/验收/下载/删除）
│       ├── Icons.jsx          # 内联 SVG 图标集（含 IconDownload）
│       ├── SelectControl.jsx  # 原生 select 下拉箭头包装
│       ├── Toast.jsx          # useToast hook — 轻量 Toast 提示
│       ├── BarChart.jsx       # 柱状图（ResizeObserver 自适应宽度）
│       ├── LineChart.jsx      # 单折线图
│       ├── MultiLineChart.jsx # 多折线图（可见/隐藏切换）
│       ├── DonutChart.jsx     # 环形图
│       └── WordCloud.jsx      # 词云（SVG 手写）
├── pages/
│   ├── Login/LoginPage.jsx
│   ├── Dashboard/
│   │   ├── index.jsx
│   │   ├── DashboardPanel.jsx
│   │   └── tabs/
│   │       ├── AllDataTab.jsx
│   │       ├── RealDataTab.jsx    # 支持 fixedProjectId prop
│   │       └── OpenDataTab.jsx
│   ├── Project/
│   │   ├── index.jsx              # 采集项目列表（卡片/列表，点查询）
│   │   ├── Detail.jsx             # 项目详情（3 Tab + 采标方案 3 二级 Tab）
│   │   └── AnnotationTemplateTab.jsx  # 历史组件，当前采标方案未引用
│   ├── Task/
│   │   ├── index.jsx              # 任务列表（支持 fixedProjectId prop，点查询）
│   │   ├── Detail.jsx             # 任务详情（2 Tab：采集条目/任务信息）
│   │   ├── TaskTable.jsx          # 可复用任务表格（含按状态分操作栏）
│   │   └── CreateTaskModal.jsx
│   ├── Review/
│   │   ├── Workbench.jsx          # 审核工作台（独立全屏路由）
│   │   ├── mock/signalData.js     # 信号图 mock 数据生成
│   │   └── components/
│   │       ├── CameraMock.jsx
│   │       ├── UrdfTrajectoryMock.jsx
│   │       ├── SignalChartMock.jsx  # recharts 折线图
│   │       └── PlayheadOverlay.jsx
│   ├── UploadRecord/index.jsx     # 上传记录（含 SDK 折叠说明）
│   ├── Dataset/
│   │   ├── Self.jsx               # 真机数据集列表
│   │   ├── SelfDetail.jsx         # 真机数据集详情（3 Tab）
│   │   ├── SelfDownload.jsx       # 数据集下载说明
│   │   ├── CreateDatasetModal.jsx
│   │   ├── UpdateDatasetModal.jsx
│   │   ├── Open.jsx               # 开源数据集列表
│   │   ├── OpenDownload.jsx
│   │   ├── OpenUsage.jsx
│   │   └── ImportOpenDatasetModal.jsx
│   ├── Tag/
│   │   ├── index.jsx              # 标签管理（采集标签 / 设备标签）
│   │   ├── TagTableActions.jsx
│   │   ├── SceneTypePanel.jsx
│   │   └── SceneTypeModal.jsx
│   ├── Device/
│   │   ├── index.jsx              # 设备实例 / 设备类型 Tab 容器
│   │   ├── InstanceList.jsx       # 实例列表（看板 + 跨类型表格）
│   │   └── TypeList.jsx           # 设备类型列表
│   └── System/
│       ├── UserManage.jsx         # 用户管理（用户列表）
│       ├── RoleManage.jsx         # 角色管理（原角色权限 Tab）
│       ├── RolePermissionModal.jsx
│       ├── NoPermission.jsx
│       ├── LogPage.jsx
│       └── index.jsx
├── context/
│   └── AuthContext.jsx            # AuthProvider
├── App.jsx                        # AuthProvider + RouterProvider
├── main.jsx
├── utils/
│   ├── datasetMetrics.js          # 真机数据集：条目筛选、指标计算、变更 diff
│   ├── openDatasetMetrics.js      # 开源数据集：dataSize/trajCount 解析
│   └── deviceTypeName.js          # buildTypeName / buildTypeNameReference
├── mock/
│   ├── projects.js                # 采集项目（8 条）
│   ├── plans.js                   # 采集方案、质检项、播放布局
│   ├── tasks.js                   # 采集任务（15 条）
│   ├── entries.js                 # 采集条目 + 6 值 dataStatus + runtime patch
│   ├── uploads.js                 # 上传记录（由 entries 派生）
│   ├── datasets.js                # 真机/开源数据集 mock + runtime API
│   ├── tags.js                    # 采集/设备标签、sceneTypeTree、auditReviewTags
│   ├── devices.js                 # 设备类型 + 实例运行时 store
│   ├── permissions.js             # RBAC 权限目录、preset、数据范围 helper
│   ├── rbac.js                    # 角色 runtime + 演示身份列表
│   ├── dashboard.js               # 运营看板 mock
│   └── misc.js                    # 用户、项目成员、robotBodies、annotationTemplates
└── router/index.jsx
```

---

## 技术说明

| 项目 | 说明 |
|---|---|
| 图表库 | 运营看板为手写 SVG（`BarChart`、`DonutChart` 等）；审核工作台信号图使用 **recharts** |
| 图表自适应 | 手写 SVG 组件使用 `ResizeObserver` 动态读取容器宽度 |
| 路由 | `createBrowserRouter`；`/` → `/login`；未知路径 `*` → `/dashboard`；`/review/:entryId` 为 AppLayout 外独立路由；`/device/:typeId` → 重定向 `/device` |
| 依赖 | React 19、Vite 8、Tailwind CSS 4、react-router-dom 7、recharts、xlsx（SheetJS，开源数据集 Excel 导入） |
| 登录态 | 无持久化；登录页任意账号进入 `/dashboard`；**默认身份 U-001 张华** |
| RBAC | `permissions.js` catalog + preset；`rbac.js` 运行时 `permissions[]`；刷新后恢复 preset |
| 条目状态 runtime | `entries.js` → `updateEntry` / `runtimePatches`；审核工作台提交后更新 `dataStatus` 与会话内持久 |
| 运营看板 mock | `dashboard.js` → `realDashboard` 按 `all` + 各项目 ID；`allRanking` 采集员/标注员各 12 条（含完成时长/驳回 mock）；`enrichRankingList` 补全项目级排行榜字段 |
| 状态管理 | 全部 `useState` + `useMemo` 本地状态，无 Redux/Zustand |
| 表单校验 | 点击提交时触发，必填字段边框变红 |
| 删除确认 | 重要删除需输入名称完全匹配；标签/设备为 Modal 二次确认 |
| Toast | `useToast` hook，2.5 秒自动消失 |
| 表格对齐 | `Table` 表头与单元格默认水平居中；支持 `pageSize` 分页 + `scrollVisibleRows`/`bodyRowHeight` 组合（运营看板任务进度 5 行、排行榜 6 行可见，每页 10 条） |
| 筛选交互 | 绝大多数列表页点击「查询」生效；**角色管理**页（`/system/role`）筛选为输入即过滤 |
| 筛选布局惯例 | 筛选项左侧 `flex min-w-0 flex-1` + 各字段 `flex-1 basis-0`；「重置」「查询」固定右侧 `shrink-0` |
| 弹窗限高 | `Modal` 的 `fitViewport`：限高 85vh、内容区滚动、底部按钮固定 |
| 真机数据集 runtime | `getDatasetById`、`patchSelfDataset`、`prependSelfDataset` |
| 开源数据集 runtime | `getAllOpenDatasets`、`prependOpenDatasets` 等 |
| 设备管理 runtime | `getAllDeviceTypes`、`setDeviceTypes`、`getAllDeviceInstances`、`setDeviceInstances`、`getNextInstanceCode` 等 |
| 采集方案 runtime | `appendPlan`、`updatePlanInStore`、`copyPlanInStore`、`publishPlanInStore`、`deletePlanFromStore`、`getQcItemsByProjectId`、`updateQcItemInStore`、`buildDefaultPlayLayoutRow` |
| Logo | `src/assets/logo.png` |

---

## Mock 数据规模

| 数据类型 | 条数 / 说明 |
|---|---|
| 采集项目 | 8 条（含不同状态；mock 仍含 `type` 正式/测试，UI 不展示；`createdAt` 精确到秒） |
| 采集方案 | 18 条（每项目 2~3 条；状态 **草稿/已发布**；含 `deviceTypeId`、场景路径、步骤、标注开关） |
| 质检项 | 每项目固定 6 条（8 项目 × 6 = 48 条；`plans.js` → `getQcItemsByProjectId`） |
| 播放布局 | 10 条自建（`playLayouts`，覆盖 P-1001~P-1008）；列表首行另含 UI 固定「默认布局」；新建需上传 JSON 布局文件（mock） |
| 采集任务 | 15 条（分布于 7 个项目；P-1007 暂无任务；状态 **草稿/已发布/已归档**；采集员/标注员支持多人） |
| 采集条目 | 每任务 5~10 条（伪随机生成）；**6 值** `dataStatus`；含 `actionSegments`、`regionFrames`、审核/验收字段 |
| 上传记录 | 由 `entries` 派生，字段与条目列表对齐 |
| 真机数据集 | 5 条；绑定 `projectId`、`taskIds`、`statuses`、`formats`、`entryIds` |
| 开源数据集 | 10 条（ODS-001~010）；支持 Excel 导入追加 |
| 采集标签 | 任务类型 2、采集方案 2、原子技能 7；场景类型三层树（3 个一级场景） |
| 设备标签 | 本体 2、末端 4、相机 2、雷达 1 |
| 设备类型 | 5 条（`DTY-001`~`005`）；时间戳精确到秒 |
| 设备实例 | 10 条；含 `status`（在线/离线）、`battery`（0~100）、`description`、`createdAt`、`updatedAt` |
| 整机配置 | `robotBodies` 6 条（采标方案本体类型解析，与设备管理独立） |
| 标注模板 | 3 条（`misc.js` → `annotationTemplates`，**当前 UI 未接入**；标注由采集方案步骤生成） |
| 用户 | 9 人（见下表；默认演示 U-001 张华） |
| 内置角色 | 6 个：`管理员` / `平台运营` / `采集员` / `标注员` / `游客` / `工程师`（`rbac.js` R-001~R-006） |
| 项目成员 | 按项目 ID 组织；`joinedAt` 精确到 `YYYY-MM-DD HH:mm:ss` |
| 系统日志 | 15 条 |
| 运营看板（真机） | `realDashboard.all` 汇总 8 项目；各 `P-1001`~`P-1008` 独立 metrics + 精简 ranking；全局 ranking 采集员/标注员各 12 名 |

### Mock 用户（`misc.js` → `users`）

| UID | username | 昵称 | 角色 | 状态 | 邮箱（`USER_EMAILS`） |
|---|---|---|---|---|---|
| U-001 | zhanghua | 张华 | 管理员 | 启用 | zhanghua@ai2robotics.com |
| U-002 | liming | 李明 | 平台运营 | 启用 | ming.li@ai2robotics.com |
| U-003 | wangfang | 王芳 | 平台运营 | 启用 | wangfang@ai2robotics.com |
| U-004 | liuwei | 刘伟 | 采集员 | 启用 | liuwei@ai2robotics.com |
| U-005 | zhoujie | 周杰 | 采集员 | 启用 | zhoujie@ai2robotics.com |
| U-006 | sunli | 孙丽 | 标注员 | 启用 | sunli@ai2robotics.com |
| U-007 | hemin | 何敏 | 标注员 | **停用** | hemin@ai2robotics.com |
| U-008 | qianlin | 钱琳 | 标注员 | 启用 | qianlin@ai2robotics.com |
| U-009 | zhaoyan | 赵研 | 游客 | 启用 | zhao.yan@ai2robotics.com |
| U-010 | chengong | 陈工 | 工程师 | 启用 | cheng.gong@ai2robotics.com |

> 停用用户（何敏）不会出现在演示身份切换列表与项目成员添加候选列表。演示切换含 **游客（赵研 / U-009）** 与 **工程师（陈工 / U-010）**，用于验证只读/下载权限差异。

### 采集条目数据状态色值（`entries.js` → `dataStatusColor`）

| 状态 | 颜色 |
|---|---|
| 已上传 | gray |
| 已解析 | blue |
| 审核不通过 | red |
| 已审核 | purple |
| 验收不通过 | orange |
| 已验收 | cyan |

### 设备类型单条字段（`devices.js`）
`id`, `name`, `body`, `leftEnd`, `rightEnd`, `urdf`, `description`, `creator`, `createdAt`, `updatedAt`（列表附加 `instanceCount`）

### 设备实例单条字段
`id`, `typeId`, `code`, `sn`, `status`（在线/离线）, `battery`（0~100）, `description`（选填）, `createdAt`, `updatedAt`, `registeredAt`（兼容字段）

### 实例编号示例（mock 初始数据）

| 编号 | 说明 |
|---|---|
| `DEV-A01` ~ `DEV-F01` 等 | 历史字母编号，保留不变 |
| `DEV-001` 起 | 新建实例自动分配的全局递增三位数字编号 |

### 项目成员单条字段
`id`, `name`, `roles[]`, `taskIds[]`, `joinedAt`（`YYYY-MM-DD HH:mm:ss`）

---

## 路由一览

| 路径 | 页面 | view 权限（摘要） |
|---|---|---|
| `/login` | 登录 | — |
| `/` | 重定向 → `/login` | — |
| `/dashboard` | 运营看板 | `dashboard.view` |
| `/collection/project` | 采集项目列表 | `collection.project.view` |
| `/collection/project/:id` | 项目详情 | 同上 |
| `/collection/task` | 采集任务列表 | `collection.task.view` |
| `/collection/task/:id` | 任务详情（含数据范围校验） | 同上 |
| `/collection/upload` | 上传记录 | `collection.upload.view` |
| `/review/:entryId` | 审核工作台（独立全屏，无侧边栏） | `collection.task.view` |
| `/dataset/self` | 真机数据集列表 | `dataset.self.view` |
| `/dataset/self/download` | 数据集下载说明 | 同上 |
| `/dataset/self/:id` | 真机数据集详情 | 同上 |
| `/dataset/open` | 开源数据集列表 | `dataset.open.view` |
| `/dataset/open/download` | 开源数据集下载说明 | 同上 |
| `/dataset/open/:id/usage` | 开源数据集详情 | 同上 |
| `/tag` | 标签管理 | `tag.view` |
| `/device` | 设备管理（实例 Tab 默认） | `device.view` |
| `/device/:typeId` | 重定向 → `/device` | — |
| `/system` | 重定向 → `/system/user` | `system.user.view` 或 `system.role.view` |
| `/system/user` | 用户管理（用户列表） | `system.user.view` |
| `/system/role` | 角色管理（角色列表 + 权限配置） | `system.role.view` |
| `/system/log` | 系统日志 | `system.log.view` |
| `*` | 未知路径 → `/dashboard` | 由目标页决定 |
