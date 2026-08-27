import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  WalletCards,
  ClipboardList,
  CircleCheck,
} from "lucide-react";

interface Loan {
  full_name: string;
  loan_id: number;
  principal_amount: string;
  amount_due: string;
  total_paid: string;
  remaining_balance: string;
  due_date: string;
  status: "active" | "paid" | "defaulted";
}

interface Payment {
  id: number;
  loan_id: number;
  full_name: string;
  amount_paid: string;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface PaymentsProps {
  onBack: () => void;
}

const API_URL = "https://lendflow-server-w4bp.onrender.com/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
}); 

function Payments({ onBack }: PaymentsProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    loan_id: "",
    amount_paid: "",
    payment_method: "M-Pesa",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadPaymentsData = async () => {
      try {
        const [loansResponse, paymentsResponse] =
  await Promise.all([
    fetch(`${API_URL}/loans`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
    fetch(`${API_URL}/payments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
  ]);

        if (
          !loansResponse.ok ||
          !paymentsResponse.ok
        ) {
          throw new Error(
            "Failed to load payment information",
          );
        }

        const loansData = await loansResponse.json();
        const paymentsData =
          await paymentsResponse.json();

        if (!cancelled) {
          setLoans(loansData);
          setPayments(paymentsData);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load payments.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPaymentsData();

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
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const selectedLoan = loans.find(
    (loan) =>
      loan.loan_id === Number(formData.loan_id),
  );

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/payments`,
        {
          method: "POST",
          headers: {
  "Content-Type": "application/json",
  ...authHeaders(),
},
          body: JSON.stringify({
            loan_id: Number(formData.loan_id),
            amount_paid: Number(
              formData.amount_paid,
            ),
            payment_method:
              formData.payment_method,
            notes: formData.notes,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to record payment",
        );
      }

      setSuccess(
        `Payment recorded successfully. Remaining balance: ${formatCurrency(
          Number(data.remaining_balance),
        )}`,
      );

      setFormData({
        loan_id: "",
        amount_paid: "",
        payment_method: "M-Pesa",
        notes: "",
      });

        const [loansResponse, paymentsResponse] =
          await Promise.all([
            fetch(`${API_URL}/loans`),
            fetch(`${API_URL}/payments`),
          ]);

      const loansData = await loansResponse.json();
      const paymentsData =
        await paymentsResponse.json();

      setLoans(loansData);
      setPayments(paymentsData);

      setShowForm(false);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to record payment.");
      }
    }
  };

  const totalCollected = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount_paid),
    0,
  );

  const outstandingBalance = loans
    .filter((loan) => loan.status !== "paid")
    .reduce(
      (total, loan) =>
        total + Number(loan.remaining_balance),
      0,
    );

  const activeLoans = loans.filter(
    (loan) => loan.status === "active",
  );

  return (
    <div className="clients-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Transactions</p>

          <h1>Payments</h1>

          <p className="page-description">
            Record and monitor borrower repayments.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={onBack}
          >
            <ArrowLeft size={18} strokeWidth={2} />
            Dashboard
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
                <CreditCard size={18} strokeWidth={2} />
                Record Payment
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

<div className="success-banner">
  <CircleCheck size={18} strokeWidth={2} />
  {success}
</div>

      {/* Payment Summary */}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>

          <div>
            <p>Total Collected</p>

            <h2>
              {formatCurrency(totalCollected)}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon default-icon">
            <WalletCards size={22} strokeWidth={2} />
          </div>

          <div>
            <p>Outstanding</p>

            <h2>
              {formatCurrency(outstandingBalance)}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active-icon">
            <ClipboardList size={22} strokeWidth={2} />
          </div>

          <div>
            <p>Active Loans</p>

            <h2>{activeLoans.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon paid-icon">
            <CreditCard size={22} strokeWidth={2} />
          </div>

          <div>
            <p>Payments</p>

            <h2>{payments.length}</h2>
          </div>
        </div>
      </section>

      {/* Payment Form */}

      {showForm && (
        <section className="form-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">
                New transaction
              </p>

              <h2>Record Payment</h2>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="client-form"
          >
            <div className="form-group full-width">
              <label htmlFor="loan_id">
                Loan *
              </label>

              <select
                id="loan_id"
                name="loan_id"
                value={formData.loan_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select a loan
                </option>

                {loans
                  .filter(
                    (loan) =>
                      loan.status !== "paid" &&
                      Number(
                        loan.remaining_balance,
                      ) > 0,
                  )
                  .map((loan) => (
                    <option
                      key={loan.loan_id}
                      value={loan.loan_id}
                    >
                      {loan.full_name} — Loan #
                      {loan.loan_id} — Balance{" "}
                      {formatCurrency(
                        Number(
                          loan.remaining_balance,
                        ),
                      )}
                    </option>
                  ))}
              </select>
            </div>

            {selectedLoan && (
              <div className="loan-preview">
                <div>
                  <span>Client</span>
                  <strong>
                    {selectedLoan.full_name}
                  </strong>
                </div>

                <div>
                  <span>Amount Due</span>
                  <strong>
                    {formatCurrency(
                      Number(
                        selectedLoan.amount_due,
                      ),
                    )}
                  </strong>
                </div>

                <div>
                  <span>Already Paid</span>
                  <strong>
                    {formatCurrency(
                      Number(
                        selectedLoan.total_paid,
                      ),
                    )}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>
                    {formatCurrency(
                      Number(
                        selectedLoan.remaining_balance,
                      ),
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="amount_paid">
                Payment Amount *
              </label>

              <input
                id="amount_paid"
                name="amount_paid"
                type="number"
                min="1"
                max={
                  selectedLoan
                    ? Number(
                        selectedLoan.remaining_balance,
                      )
                    : undefined
                }
                value={formData.amount_paid}
                onChange={handleChange}
                placeholder="e.g. 50000"
                required
              />

              {selectedLoan && (
                <small className="field-help">
                  Maximum payment:{" "}
                  {formatCurrency(
                    Number(
                      selectedLoan.remaining_balance,
                    ),
                  )}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="payment_method">
                Payment Method
              </label>

              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="M-Pesa">
                  M-Pesa
                </option>

                <option value="Cash">
                  Cash
                </option>

                <option value="Bank">
                  Bank Transfer
                </option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional payment notes..."
                rows={3}
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
                <CreditCard size={18} strokeWidth={2} />
                Record Payment
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Payment History */}

      <section className="content-card clients-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Transaction history</p>

            <h2>Payment History</h2>
          </div>

          <span className="record-count">
            {payments.length} payments
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>No payments recorded yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Loan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>
                        {payment.full_name}
                      </strong>

                      <span className="loan-id">
                        Payment #{payment.id}
                      </span>
                    </td>

                    <td>
                      Loan #{payment.loan_id}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          Number(
                            payment.amount_paid,
                          ),
                        )}
                      </strong>
                    </td>

                    <td>
                      {payment.payment_method ||
                        "—"}
                    </td>

                    <td>
                      {new Date(
                        payment.payment_date,
                      ).toLocaleDateString(
                        "en-KE",
                      )}
                    </td>

                    <td>
                      {payment.notes || "—"}
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

export default Payments;