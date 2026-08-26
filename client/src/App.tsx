import { useState } from "react";
import Clients from "./components/Clients";
import Loans from "./components/Loans";
import Payments from "./components/Payments";
import Dashboard from "./components/Dashboard";
import "./App.css";
import Login from "./components/login";
import {
  LayoutDashboard,
  Users,
  Banknote,
  CreditCard,
  LogOut,
  Landmark,
} from "lucide-react";

type Page = "dashboard" | "clients" | "loans" | "payments";

function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");

  const [isAuthenticated, setIsAuthenticated] =
    useState(() => {
      return Boolean(localStorage.getItem("token"));
    });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsAuthenticated(false);
    setCurrentPage("dashboard");
  };

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
  <Landmark size={24} strokeWidth={2.2} />
</div>

          <div>
            <h2>LendFlow</h2>
            <span>Loan Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">MAIN MENU</p>

          <button
            type="button"
            className={`nav-item ${
              currentPage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage("dashboard")
            }
          >
            <LayoutDashboard />
            Dashboard
          </button>

          <button
            type="button"
            className={`nav-item ${
              currentPage === "clients"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage("clients")
            }
          >
            <Users />
            Clients
          </button>

          <button
            type="button"
            className={`nav-item ${
              currentPage === "loans"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage("loans")
            }
          >
            <Banknote />
            Loans
          </button>

          <button
            type="button"
            className={`nav-item ${
              currentPage === "payments"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage("payments")
            }
          >
            <CreditCard />
            Payments
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">PW</div>

          <div className="sidebar-user-info">
            <strong>Administrator</strong>
            <span>Loan Manager</span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut />
          </button>
        </div>
      </aside>

      {currentPage === "dashboard" && (
        <Dashboard onNavigate={setCurrentPage} />
      )}

      {currentPage === "clients" && (
        <main className="main-content">
          <Clients
            onBack={() =>
              setCurrentPage("dashboard")
            }
          />
        </main>
      )}

      {currentPage === "loans" && (
        <main className="main-content">
          <Loans
            onBack={() =>
              setCurrentPage("dashboard")
            }
          />
        </main>
      )}

      {currentPage === "payments" && (
        <main className="main-content">
          <Payments
            onBack={() =>
              setCurrentPage("dashboard")
            }
          />
        </main>
      )}
    </div>
  );
}

export default App;