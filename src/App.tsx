import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { FormsPage } from '@/pages/FormsPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/new" element={<FormBuilderPage />} />
          <Route path="/forms/edit/:id" element={<FormBuilderPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
