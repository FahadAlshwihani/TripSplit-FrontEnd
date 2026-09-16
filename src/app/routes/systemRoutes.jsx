import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const NotFound = lazy(() => import('../../pages/NotFoundPage'));

const systemRoutes = [
  <Route path="/not-found" element={<NotFound />} key="not-found" />,
  <Route path="*" element={<NotFound />} key="catch-all" />,
];

export default systemRoutes;
