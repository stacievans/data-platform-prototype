import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSceneTypeTree } from '../../mock/tags'
import { IconChevronDown } from './Icons'
import { nativeSelectChevronCls } from './SelectControl'

const COL_WIDTH = 128

function flattenSceneTags(tree) {
  const results = []
  tree.forEach((scene) => {
    scene.subScenes?.forEach((sub) => {
      sub.tags?.forEach((tag) => {
        results.push({
          sceneId: scene.id,
          subSceneId: sub.id,
          tagId: tag.id,
          label: [scene.name, sub.name, tag.name].join(' / '),
        })
      })
    })
  })
  return results
}

function ChevronRight() {
  return (
    <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function CascadeColumn({ items, activeId, onSelect, showArrow = false }) {
  return (
    <div
      className="shrink-0 overflow-y-auto border-r border-gray-100 last:border-r-0"
      style={{ width: COL_WIDTH, maxHeight: 240 }}
    >
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full cursor-pointer px-2.5 py-2 text-left text-sm transition ${
              active ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="inline-flex max-w-full items-center gap-0.5">
              <span className="truncate">{item.name}</span>
              {showArrow && <ChevronRight />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function SceneCascader({
  sceneId = '',
  subSceneId = '',
  tagId = '',
  onChange,
  error = false,
  disabled = false,
  placeholder = '请选择场景标签',
}) {
  const tree = useMemo(() => getSceneTypeTree(), [])
  const flatTags = useMemo(() => flattenSceneTags(tree), [tree])

  const [open, setOpen] = useState(false)
  const [activeSceneId, setActiveSceneId] = useState('')
  const [activeSubSceneId, setActiveSubSceneId] = useState('')
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: COL_WIDTH })
  const rootRef = useRef(null)
  const panelRef = useRef(null)

  const selectedLabel = useMemo(() => {
    const hit = flatTags.find((t) => t.sceneId === sceneId && t.subSceneId === subSceneId && t.tagId === tagId)
    return hit?.label ?? ''
  }, [flatTags, sceneId, subSceneId, tagId])

  const activeScene = tree.find((s) => s.id === activeSceneId)
  const subScenes = activeScene?.subScenes ?? []
  const activeSub = subScenes.find((s) => s.id === activeSubSceneId)
  const tags = activeSub?.tags ?? []

  const visibleColumnCount = 1 + (activeSceneId ? 1 : 0) + (activeSubSceneId ? 1 : 0)

  const updateMenuPos = () => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const panelWidth = COL_WIDTH * visibleColumnCount
    let left = rect.left
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8)
    }
    setMenuPos({ top: rect.bottom + 4, left, width: panelWidth })
  }

  useEffect(() => {
    if (!open) return undefined
    updateMenuPos()
    const onDocClick = (e) => {
      if (rootRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onReposition = () => updateMenuPos()
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, visibleColumnCount])

  const openPanel = () => {
    setActiveSceneId(sceneId || '')
    setActiveSubSceneId(subSceneId || '')
    setOpen(true)
  }

  const commitSelection = (next) => {
    onChange?.(next)
    setOpen(false)
  }

  const handleSceneSelect = (item) => {
    setActiveSceneId(item.id)
    setActiveSubSceneId('')
  }

  const handleSubSelect = (item) => {
    setActiveSubSceneId(item.id)
  }

  const panel = open && !disabled ? createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
      className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
    >
      <div className="flex">
        <CascadeColumn
          items={tree}
          activeId={activeSceneId}
          showArrow
          onSelect={handleSceneSelect}
        />
        {activeSceneId && (
          <CascadeColumn
            items={subScenes}
            activeId={activeSubSceneId}
            showArrow
            onSelect={handleSubSelect}
          />
        )}
        {activeSubSceneId && (
          <div className="shrink-0 overflow-y-auto" style={{ width: COL_WIDTH, maxHeight: 240 }}>
            {tags.map((tag) => {
              const active = tag.id === tagId && activeSubSceneId === subSceneId && activeSceneId === sceneId
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => commitSelection({
                    sceneId: activeSceneId,
                    subSceneId: activeSubSceneId,
                    tagId: tag.id,
                  })}
                  className={`w-full cursor-pointer px-2.5 py-2 text-left text-sm transition ${
                    active ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{tag.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          if (open) setOpen(false)
          else openPanel()
        }}
        className={`relative flex h-8 w-full items-center rounded-md border bg-white px-3 text-left text-sm outline-none transition focus:ring-2 ${nativeSelectChevronCls} ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
            : error
              ? 'cursor-pointer border-red-400 focus:ring-red-100'
              : 'cursor-pointer border-gray-300 focus:border-blue-500 focus:ring-blue-100'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedLabel ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-400">
          <IconChevronDown />
        </span>
      </button>
      {panel}
    </div>
  )
}
