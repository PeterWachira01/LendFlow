import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  AlertTriangle,
  CircleCheck,
  ClipboardList,
} from "lucide-react";

interface Loan {
  full_name: string;
  loan_id: number;
  principal_amount: string;
  interest_rate: string;
  amount_due: string;
  total_paid: string;
  remaining_balance: string;
  loan_date: string;
  due_date: string;
  status: "active" | "paid" | "defaulted";
}

interface Client {
  id: number;
  full_name: string;
}

interface LoansProps {
  onBack: () => void;
}

const API_URL = "https://lendflow-server-w4bp.onrender.com/api";

function Loans({ onBack }: LoansProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    client_id: "",
    principal_amount: "100000",
  });

  useEffect(() => {
    let cancelled = false;

    const loadLoans = async () => {
      try {
        const token = localStorage.getItem("token");

const [loansResponse, clientsResponse] =
  await Promise.all([
    fetch(`${API_URL}/loans`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    fetch(`${API_URL}/clients`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ]); 

        if (
          !loansResponse.ok ||
          !clientsResponse.ok
        ) {
          throw new Error(
            "Failed to load loan information",
          );
        }

        const loansData = await loansResponse.json();
        const clientsData =
          await clientsResponse.json();

        if (!cancelled) {
          setLoans(loansData);
          setClients(clientsData);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load loans.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLoans();

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

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/loans`,
        {
          method: "POST",
          headers: {
             "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          body: JSON.stringify({
            client_id: Number(formData.client_id),
            principal_amount: Number(
              formData.principal_amount,
            ),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create loan",
        );
      }

      // Reload loans so the new loan has the
      // client's name and calculated values.
      const loansResponse = await fetch(
        `${API_URL}/loans`,
      );

      if (!loansResponse.ok) {
        throw new Error(
          "Loan created, but failed to refresh loans",
        );
      }

      const loansData = await loansResponse.json();

      setLoans(loansData);

      setFormData({
        client_id: "",
        principal_amount: "100000",
      });

      setShowForm(false);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create loan.");
      }
    }
  };

  const activeLoans = loans.filter(
    (loan) => loan.status === "active",
  );

  const defaultedLoans = loans.filter(
    (loan) => loan.status === "defaulted",
  );

  const paidLoans = loans.filter(
    (loan) => loan.status === "paid",
  );

  return (
    <div className="clients-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Management</p>

          <h1>Loans</h1>

          <p className="page-description">
            Manage loans, repayments, balances and
            due dates.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={onBack}
          >
            <>
  <ArrowLeft size={18} strokeWidth={2} />
  Dashboard
</>
          </button>

          <button
            className="primary-button"
            onClick={() =>
              setShowForm((previous) => !previous)
            }
          >
            {showForm ? (
  "Cancel"
) : (
  <>
    <Banknote size={18} strokeWidth={2} />
    New Loan
  </>
)}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Loan Summary */}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active-icon">
  <Banknote size={24} strokeWidth={2} />
</div>

          <div>
            <p>Active Loans</p>
            <h2>{activeLoans.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon default-icon">
  <AlertTriangle size={24} strokeWidth={2} />
</div>

          <div>
            <p>Defaulted</p>
            <h2>{defaultedLoans.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon paid-icon">
  <CircleCheck size={24} strokeWidth={2} />
</div>

          <div>
            <p>Paid</p>
            <h2>{paidLoans.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon clients-icon">
  <ClipboardList size={24} strokeWidth={2} />
</div>

          <div>
            <p>Total Loans</p>
            <h2>{loans.length}</h2>
          </div>
        </div>
      </section>

      {/* Create Loan Form */}

      {showForm && (
        <section className="form-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">
                New transaction
              </p>

              <h2>Create Loan</h2>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="client-form"
          >
            <div className="form-group">
              <label htmlFor="client_id">
                Client *
              </label>

              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select a client
                </option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="principal_amount">
                Principal Amount *
              </label>

              <input
                id="principal_amount"
                name="principal_amount"
                type="number"
                min="1"
                value={formData.principal_amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Interest Rate</label>

              <input
                type="text"
                value="10%"
                disabled
              />
            </div>

            <div className="form-group">
              <label>Loan Period</label>

              <input
                type="text"
                value="30 days"
                disabled
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                Create Loan
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Loans Table */}

      <section className="content-card clients-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Portfolio</p>

            <h2>All Loans</h2>
          </div>

          <span className="record-count">
            {loans.length} loans
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading loans...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="empty-state">
            <p>No loans registered yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Amount Due</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.loan_id}>
                    <td>
                      <strong>
                        {loan.full_name}
                      </strong>

                      <span className="loan-id">
                        Loan #{loan.loan_id}
                      </span>
                    </td>

                    <td>
                      {formatCurrency(
                        Number(
                          loan.principal_amount,
                        ),
                      )}
                    </td>

                    <td>
                      {loan.interest_rate}%
                    </td>

                    <td>
                      {formatCurrency(
                        Number(loan.amount_due),
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        Number(loan.total_paid),
                      )}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          Number(
                            loan.remaining_balance,
                          ),
                        )}
                      </strong>
                    </td>

                    <td>
                      {new Date(
                        loan.due_date,
                      ).toLocaleDateString(
                        "en-KE",
                      )}
                    </td>

                    <td>
                      <span
                        className={`status ${loan.status}`}
                      >
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Loans;