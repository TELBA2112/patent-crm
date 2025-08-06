import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
// ...
<Route path="/operator" element={<OperatorDashboard />} />
import CheckerDashboard from './pages/CheckerDashboard';
// ...
<Route path="/checker" element={<CheckerDashboard />} />
import DocumentForm from './pages/DocumentForm';
<Route path="/submit-docs/:id" element={<DocumentForm />} />
import CheckerDocReview from './pages/CheckerDocReview';
<Route path="/checker-docs" element={<CheckerDocReview />} />
import LawyerDashboard from './pages/LawyerDashboard';
<Route path="/lawyer" element={<LawyerDashboard />} />

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
