import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/app-layout'
import { OverviewPage } from '@/modules/overview/pages/overview-page'
import { StructurePage } from '@/modules/structure/pages/structure-page'
import { PackagesPage } from '@/modules/packages/pages/packages-page'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="structure" element={<StructurePage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
