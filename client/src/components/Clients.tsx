import { useEffect, useState } from "react";
import type { FormEvent } from "react";

interface Client {
  id: number;
  full_name: string;
  phone: string;
  national_id: string;
  email: string | null;
  address: string | null;
  created_at: string;
}

interface ClientsProps {
  onBack: () => void;
}

const API_URL = "http://localhost:5000/api";

function Clients({ onBack }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    national_id: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadClients = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }

        const data = await response.json();

        if (!cancelled) {
          setClients(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load clients.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setError("");

      const response = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create client");
      }

      setClients((previous) => [...previous, data]);

      setFormData({
        full_name: "",
        phone: "",
        national_id: "",
        email: "",
        address: "",
      });

      setShowForm(false);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create client.");
      }
    }
  };

  const handleDelete = async (client: Client) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${client.full_name}?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const response = await fetch(
      `${API_URL}/clients/${client.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to delete client",
      );
    }

    // Remove the deleted client from the screen
    setClients((previous) =>
      previous.filter(
        (existingClient) =>
          existingClient.id !== client.id,
      ),
    );
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Failed to delete client.");
    }
  }
};

  return (
    <div className="clients-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Management</p>
          <h1>Clients</h1>
          <p className="page-description">
            Manage borrowers registered in the lending system.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={onBack}
          >
            ← Dashboard
          </button>

          <button
            className="primary-button"
            onClick={() => setShowForm((previous) => !previous)}
          >
            {showForm ? "Cancel" : "+ Add Client"}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <section className="form-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">New borrower</p>
              <h2>Add Client</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="client-form">
            <div className="form-group">
              <label htmlFor="full_name">
                Full Name *
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Jane Wambui"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone *
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 0712345678"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="national_id">
                National ID *
              </label>

              <input
                id="national_id"
                name="national_id"
                type="text"
                value={formData.national_id}
                onChange={handleChange}
                placeholder="e.g. 12345678"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. jane@email.com"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">
                Address
              </label>

              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Nairobi"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                Add Client
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="content-card clients-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Borrowers</p>
            <h2>All Clients</h2>
          </div>

          <span className="record-count">
            {clients.length} clients
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <p>No clients registered yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>National ID</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.full_name}</strong>

                      <span className="loan-id">
                        Client #{client.id}
                      </span>
                    </td>

                    <td>{client.phone}</td>

                    <td>{client.national_id}</td>

                    <td>{client.email || "—"}</td>

                    <td>{client.address || "—"}</td>

                    <td>
                      {new Date(
                        client.created_at,
                      ).toLocaleDateString("en-KE")}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDelete(client)}
                      >
                        🗑️ Delete
                      </button>
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

export default Clients;