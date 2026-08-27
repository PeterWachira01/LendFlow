import { useEffect, useState } from "react";
import {
  Banknote,
  CreditCard,
  ClipboardList,
  AlertTriangle,
  Users,
} from "lucide-react";

interface Loan {
  loan_id: number;
  principal_amount: string;
  amount_due: string;
  total_paid: string;
  remaining_balance: string;
  status: "active" | "paid" | "defaulted";
}

interface Payment {
  id: number;
  amount_paid: string;
}

type Page = "dashboard" | "clients" | "loans" | "payments";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const API_URL = "https://lendflow-server-w4bp.onrender.com/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function Dashboard({ onNavigate }: DashboardProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [loansResponse, paymentsResponse] =
          await Promise.all([
            fetch(`${API_URL}/loans`, {
              headers: authHeaders(),
            }),
            fetch(`${API_URL}/payments`, {
              headers: authHeaders(),
            }),
          ]);

        if (!loansResponse.ok || !paymentsResponse.ok) {
          throw new Error(
            "Failed to load dashboard data",
          );
        }

        const loansData = await loansResponse.json();
        const paymentsData =
          await paymentsResponse.json();

        if (!cancelled) {
          setLoans(loansData);
          setPayments(paymentsData);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(amount);

  const totalLent = loans.reduce(
    (total, loan) =>
      total + Number(loan.principal_amount),
    0,
  );

  const totalCollected = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount_paid),
    0,
  );

  const outstanding = loans
    .filter((loan) => loan.status !== "paid")
    .reduce(
      (total, loan) =>
        total + Number(loan.remaining_balance),
      0,
    );

  const activeLoans = loans.filter(
    (loan) => loan.status === "active",
  ).length;

  const paidLoans = loans.filter(
    (loan) => loan.status === "paid",
  ).length;

  const defaultedLoans = loans.filter(
    (loan) => loan.status === "defaulted",
  ).length;

  return (
    <main className="main-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">LendFlow</p>

          <h1>Welcome back!</h1>

          <p className="page-description">
            Here's what's happening with
            your lending business.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon clients-icon">
                <Banknote />
              </div>

              <div>
                <p>Total Lent</p>
                <h2>
                  {formatCurrency(totalLent)}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon paid-icon">
                <CreditCard />
              </div>

              <div>
                <p>Total Collected</p>
                <h2>
                  {formatCurrency(totalCollected)}
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon active-icon">
                <ClipboardList />
              </div>

              <div>
                <p>Active Loans</p>
                <h2>{activeLoans}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon default-icon">
  <AlertTriangle size={24} strokeWidth={2} />
</div>

              <div>
                <p>Outstanding</p>
                <h2>
                  {formatCurrency(outstanding)}
                </h2>
              </div>
            </div>
          </section>

          <section className="financial-card">
            <div className="portfolio-summary">
              <p>Portfolio Overview</p>

              <h2>
                {formatCurrency(outstanding)}
              </h2>

              <span>
                Total outstanding loan balance
              </span>
            </div>

            <div className="financial-details">
              <div>
                <span>Loans</span>
                <strong>{loans.length}</strong>
              </div>

              <div>
                <span>Paid</span>
                <strong>{paidLoans}</strong>
              </div>

              <div>
                <span>Defaulted</span>
                <strong>{defaultedLoans}</strong>
              </div>
            </div>
          </section>

          <section className="content-card">
            <div className="section-summary">
              <div className="quick-actions-heading">
                <p className="eyebrow">
                  Quick actions
                </p>

                <h1>
                  Manage Your Lending Business
                </h1>
              </div>
            </div>

            <div className="quick-actions">
              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  onNavigate("clients")
                }
              >
                <span className="quick-action-icon">
  <Users size={22} strokeWidth={2} />
</span>

                <div>
                  <strong>Manage Clients</strong>

                  <small>
                    Add and view your borrowers
                  </small>
                </div>
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  onNavigate("loans")
                }
              >
                <span className="quick-action-icon">
  <Banknote size={22} strokeWidth={2} />
</span>

                <div>
                  <strong>Manage Loans</strong>

                  <small>
                    Create and monitor loans
                  </small>
                </div>
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  onNavigate("payments")
                }
              >
                <span className="quick-action-icon">
  <CreditCard size={22} strokeWidth={2} />
</span>

                <div>
                  <strong>Record Payment</strong>

                  <small>
                    Record borrower repayments
                  </small>
                </div>
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;