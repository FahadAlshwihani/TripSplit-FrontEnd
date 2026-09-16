import React, { Suspense } from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import NeoLoading from '../../shared/components/NeoLoading';
import SessionLifecycle from '../../auth/SessionLifecycle';
import publicRoutes from './publicRoutes';
import accountRoutes from './accountRoutes';
import tripRoutes from './tripRoutes';
import systemRoutes from './systemRoutes';
import SeoHead from '../../seo/SeoHead';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <SeoHead />
      <SessionLifecycle />
      <Suspense fallback={<NeoLoading />}>
        <Routes>
          {publicRoutes}
          {accountRoutes}
          {tripRoutes}
          {systemRoutes}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
