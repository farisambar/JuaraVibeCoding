/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { DeadlineProvider } from './contexts/DeadlineContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { CategoryProvider } from './contexts/CategoryContext';

export default function App() {
  return (
    <CategoryProvider>
      <DeadlineProvider>
        <ScheduleProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/deadline" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ScheduleProvider>
      </DeadlineProvider>
    </CategoryProvider>
  );
}
