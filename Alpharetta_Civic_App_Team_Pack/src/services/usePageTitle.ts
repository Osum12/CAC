import { useEffect } from 'react';

export function usePageTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · Alpharetta Civic` : 'Alpharetta Civic';
  }, [title]);
}
