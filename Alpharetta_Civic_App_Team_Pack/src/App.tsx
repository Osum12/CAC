import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingState } from './components/States';
import { CitywidePage } from './pages/CitywidePage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { MeetingDetailPage } from './pages/MeetingDetailPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { ArchivePage } from './pages/ArchivePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Near Me pulls in the map library, so it loads only when someone opens it.
const NearMePage = lazy(() => import('./pages/NearMePage').then((m) => ({ default: m.NearMePage })));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CitywidePage />} />
        <Route
          path="near-me"
          element={
            <Suspense fallback={<div className="page"><LoadingState label="Loading map…" /></div>}>
              <NearMePage />
            </Suspense>
          }
        />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="issues/:issueId" element={<IssueDetailPage />} />
        <Route path="meetings/:meetingId" element={<MeetingDetailPage />} />
        <Route path="documents/:documentId" element={<DocumentDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
