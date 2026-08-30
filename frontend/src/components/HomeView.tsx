import { Database, Plus, Table2, Key, Zap, Layers, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDb } from './DbContext'

export default function HomeView() {
  const navigate = useNavigate()
  const { openDatabase, loading } = useDb()

  const handleOpenDB = async () => {
    try {
      const tbls = await openDatabase()
      if (tbls === null) return // User cancelled file picker -> preserve active DB & route

      if (tbls.length > 0) {
        navigate(`/tables/${tbls[0]}`)
      }
    } catch (err) {
      console.error('Failed to open DB:', err)
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center select-none bg-page overflow-auto">
      <div className="max-w-md flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-action-accent/15 text-action mb-6 shadow-sm">
          <Database size={32} />
        </div>

        <h1 className="text-2xl font-bold text-primary mb-2">SQLite Browser</h1>
        <p className="text-sm text-secondary mb-8">
          Select a table from the sidebar or open a SQLite database file to explore schema, composite primary keys, and data with cursor pagination.
        </p>

        <button
          onClick={handleOpenDB}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-action-accent px-5 py-2.5 text-sm font-medium text-action hover:bg-action-accent-hover active:bg-action-accent-active disabled:opacity-50 shadow-md transition-all mb-10"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Open Database File
        </button>

        <div className="grid grid-cols-2 gap-3 w-full text-left">
          <div className="p-3.5 rounded-lg border border-subtle bg-surface">
            <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
              <Zap size={14} className="text-amber-500" />
              Cursor Pagination
            </div>
            <p className="text-[11px] text-3rd">Efficient scrolling using indexed keys or internal rowids.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-subtle bg-surface">
            <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
              <Key size={14} className="text-blue-500" />
              Composite Keys
            </div>
            <p className="text-[11px] text-3rd">Full support for multi-column tuple primary key comparison.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-subtle bg-surface">
            <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
              <Layers size={14} className="text-purple-500" />
              WITHOUT ROWID
            </div>
            <p className="text-[11px] text-3rd">Native schema handling for SQLite WITHOUT ROWID tables.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-subtle bg-surface">
            <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
              <Table2 size={14} className="text-emerald-500" />
              RowID Fallback
            </div>
            <p className="text-[11px] text-3rd">Paginate tables without primary keys using internal row ids.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
