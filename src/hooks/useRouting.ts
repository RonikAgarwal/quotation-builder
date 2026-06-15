import { useState, useEffect, useCallback } from 'react';

export type ViewType = 'search' | 'quotation' | 'images' | 'pdf' | 'history';

interface RouteState {
  view: ViewType;
  pdfPage: number;
}

function parseHash(): RouteState {
  const hash = window.location.hash.replace(/^#\/?/, '');
  
  if (hash.startsWith('pdf')) {
    const parts = hash.split('/');
    const page = parts.length > 1 ? parseInt(parts[1], 10) : 1;
    return { view: 'pdf', pdfPage: isNaN(page) ? 1 : page };
  }
  
  if (['quotation', 'images', 'history'].includes(hash)) {
    return { view: hash as ViewType, pdfPage: 1 };
  }
  
  return { view: 'search', pdfPage: 1 };
}

export function useRouting() {
  const [route, setRoute] = useState<RouteState>(parseHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((view: ViewType, page?: number) => {
    if (view === 'pdf' && page) {
      window.location.hash = `/pdf/${page}`;
    } else if (view === 'search') {
      window.location.hash = `/`; // Clean root URL for search
    } else {
      window.location.hash = `/${view}`;
    }
  }, []);

  return {
    view: route.view,
    pdfPage: route.pdfPage,
    navigate
  };
}
