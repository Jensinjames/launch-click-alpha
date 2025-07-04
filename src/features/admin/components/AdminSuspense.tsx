
import React, { Suspense } from 'react';
import Layout from '@/components/layout/Layout';

const LazyAdmin = React.lazy(() => import('@/pages/Admin'));

const AdminLoadingFallback = () => (
  <Layout>
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Loading Admin Dashboard</h3>
          <p className="text-sm text-gray-600">Preparing administrative tools...</p>
        </div>
      </div>
    </div>
  </Layout>
);

const AdminSuspense = () => {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <LazyAdmin />
    </Suspense>
  );
};

export default AdminSuspense;
