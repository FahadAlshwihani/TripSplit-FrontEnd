import React, { Suspense } from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import NeoLoading from '../../shared/components/NeoLoading';
import publicRoutes from './publicRoutes';
import accountRoutes from './accountRoutes';
import tripRoutes from './tripRoutes';
import systemRoutes from './systemRoutes';

export default function AppRouter() {
  return (
    <BrowserRouter>
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
