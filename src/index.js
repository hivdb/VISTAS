import React, {Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserProtocol, queryMiddleware} from 'farce';
import {createFarceRouter, createRender, makeRouteConfig, resolver, Route} from 'found';

import vistasRoutes from './views/vistas';
import './styles.css';

if (window.location.pathname === '/') {
  window.history.replaceState(null, '', '/vistas/');
}

const routes = (
  <Route path="/">
    {vistasRoutes}
  </Route>
);

const Router = createFarceRouter({
  historyProtocol: new BrowserProtocol(),
  historyMiddlewares: [queryMiddleware],
  routeConfig: makeRouteConfig(routes),
  render: createRender({})
});

createRoot(document.getElementById('root')).render(
  <Suspense fallback={<p>Loading VISTAS…</p>}>
    <Router resolver={resolver} />
  </Suspense>
);
