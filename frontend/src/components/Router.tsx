import { Routes, Route } from 'react-router-dom'
import Table from './Table'
import HomeView from './HomeView'
import QueryEditorView from './QueryEditorView'

export default function Router() {
  return (
    <main className="flex-1 min-h-0 bg-page flex flex-col overflow-hidden">
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/tables/:tableName" element={<Table />} />
        <Route path="/query" element={<QueryEditorView />} />
      </Routes>
    </main>
  )
}
