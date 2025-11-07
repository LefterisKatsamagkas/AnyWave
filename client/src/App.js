import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import BeachPage from './pages/BeachPage';
import { BeachProvider } from './context/beachContext';


function App() {
  return (
    <BeachProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/beach-info" element={<BeachPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Router>
    </BeachProvider>
  );
}

export default App;