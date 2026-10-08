import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Agent from './pages/Agent';
import SpendingPolicy from './pages/SpendingPolicy';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import { WalletProvider, useWallet } from './context/WalletContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { connectedAddress } = useWallet();
  if (!connectedAddress) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function PublicConnectRoute({ children }: { children: React.ReactNode }) {
  const { connectedAddress } = useWallet();
  if (connectedAddress) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/connect';

  return (
    <div className={isLandingPage ? 'landing-shell' : 'app-shell'}>
      {!isLandingPage && <Navbar />}
      <main className={isLandingPage ? 'landing-main' : 'main-container'}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicConnectRoute>
                <LandingPage />
              </PublicConnectRoute>
            }
          />
          <Route
            path="/connect"
            element={
              <PublicConnectRoute>
                <LandingPage />
              </PublicConnectRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent"
            element={
              <ProtectedRoute>
                <Agent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/policy"
            element={
              <ProtectedRoute>
                <SpendingPolicy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/spending-policy"
            element={
              <ProtectedRoute>
                <SpendingPolicy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </WalletProvider>
  );
}
