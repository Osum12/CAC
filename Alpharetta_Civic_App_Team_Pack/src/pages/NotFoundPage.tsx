import { Link } from 'react-router-dom';
import { usePageTitle } from '../services/usePageTitle';

const COPY = {
  page: { title: 'Page not found', body: 'That address doesn’t match a page in this app.' },
  issue: { title: 'Issue not found', body: 'This issue isn’t in the current dataset. It may have been removed or the link may be mistyped.' },
  meeting: { title: 'Meeting not found', body: 'This meeting isn’t in the current dataset. It may have been removed or the link may be mistyped.' },
  document: { title: 'Document not found', body: 'This document isn’t in the current dataset. It may have been removed or the link may be mistyped.' },
};

export function NotFound({ kind = 'page' }: { kind?: keyof typeof COPY }) {
  usePageTitle(COPY[kind].title);
  return (
    <div className="page">
      <div className="state state--empty state--page">
        <h1 className="state__title">{COPY[kind].title}</h1>
        <p className="state__body">{COPY[kind].body}</p>
        <div className="button-row">
          <Link to="/" className="button">
            Go to Citywide
          </Link>
          <Link to="/archive" className="button button--ghost">
            Browse the archive
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return <NotFound kind="page" />;
}
