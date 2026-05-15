'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useAuth } from '@/lib/auth-store';
import { Toast, useToast } from '@/components/toast';

type Approver = {
  id: number;
  username: string;
  name: string;
  email: string;
  ph_no: string | null;
  warehouse: string | null;
  superuser: boolean;
  admin: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  username: string;
  name: string;
  email: string;
  ph_no: string;
  warehouse: string;
  password: string;
  superuser: boolean;
  admin: boolean;
  is_active: boolean;
};

const emptyForm: FormState = {
  username: '',
  name: '',
  email: '',
  ph_no: '',
  warehouse: '',
  password: '',
  superuser: false,
  admin: false,
  is_active: true,
};

export function ManageApprovers() {
  const { user } = useAuth();
  const { addToast, toasts, removeToast } = useToast();

  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Approver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Approver | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = useCallback(
    (): HeadersInit => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user?.access_token ?? ''}`,
      accept: 'application/json',
    }),
    [user?.access_token]
  );

  const fetchApprovers = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.approvers}/?skip=0&limit=500`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Failed to load approvers (${res.status}). ${body}`);
      }
      const data: Approver[] = await res.json();
      setApprovers(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load approvers', 'error');
    } finally {
      setIsLoading(false);
    }
    // addToast/authHeaders are recreated each render (useToast is not memoized).
    // Re-running this when the token changes is sufficient; otherwise the deps
    // would cause an infinite refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token]);

  // Fetch once on mount (or when the token changes after login). Depending on
  // fetchApprovers directly would re-fire endlessly because its identity changes
  // every render due to the non-memoized addToast inside useToast().
  useEffect(() => {
    fetchApprovers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (a: Approver) => {
    setForm({
      username: a.username,
      name: a.name,
      email: a.email,
      ph_no: a.ph_no ?? '',
      warehouse: a.warehouse ?? '',
      password: '',
      superuser: a.superuser,
      admin: a.admin,
      is_active: a.is_active,
    });
    setEditTarget(a);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        ph_no: form.ph_no.trim() || null,
        warehouse: form.warehouse.trim() || null,
        password: form.password,
        superuser: form.superuser,
        admin: form.admin,
      };
      const res = await fetch(`${API_ENDPOINTS.approvers}/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || body.error || `Create failed (${res.status})`);
      }
      addToast(`Approver "${payload.username}" created.`, 'success');
      setCreateOpen(false);
      await fetchApprovers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create approver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !editTarget) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        ph_no: form.ph_no.trim() || null,
        warehouse: form.warehouse.trim() || null,
        superuser: form.superuser,
        admin: form.admin,
        is_active: form.is_active,
      };
      if (form.password.trim()) {
        payload.password = form.password;
      }
      const res = await fetch(
        `${API_ENDPOINTS.approvers}/${encodeURIComponent(editTarget.username)}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || body.error || `Update failed (${res.status})`);
      }
      addToast(`Approver "${editTarget.username}" updated.`, 'success');
      setEditTarget(null);
      await fetchApprovers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update approver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting || !deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS.approvers}/${encodeURIComponent(deleteTarget.username)}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Delete failed (${res.status})`);
      }
      addToast(`Approver "${deleteTarget.username}" deleted.`, 'success');
      setDeleteTarget(null);
      await fetchApprovers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete approver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = approvers.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.username.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.ph_no ?? '').toLowerCase().includes(q) ||
      (a.warehouse ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center justify-between p-3 md:p-5 border-b border-gray-200">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900">Manage Approvers</h2>
          <p className="text-xs md:text-sm text-gray-500">
            Create, update, and remove users in <code className="bg-gray-100 px-1 rounded">vis_approvers</code>.
            Superuser only.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="text-xs md:text-sm border border-gray-300 rounded-md px-3 py-1.5 h-9 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button size="sm" onClick={fetchApprovers} variant="outline" className="h-9">
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="h-9">
            + Add Approver
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-600">Loading approvers…</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-600">
          {search ? 'No approvers match your search.' : 'No approvers yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] md:text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Warehouse</th>
                <th className="px-3 py-2 text-left">Roles</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono">{a.username}</td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2 text-gray-600">{a.email}</td>
                  <td className="px-3 py-2 text-gray-600">{a.ph_no || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{a.warehouse || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {a.superuser && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                          Superuser
                        </span>
                      )}
                      {a.admin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          Admin
                        </span>
                      )}
                      {!a.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700 border border-gray-300">
                          Inactive
                        </span>
                      )}
                      {!a.superuser && !a.admin && a.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                          Approver
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="h-8">
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(a)}
                        className="h-8"
                        disabled={a.username === user?.username}
                        title={a.username === user?.username ? "You can't delete yourself" : undefined}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <ApproverModal
          title="Add Approver"
          submitLabel="Create"
          form={form}
          setForm={setForm}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          submitting={submitting}
          requirePassword
          showUsername
          showIsActive={false}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <ApproverModal
          title={`Edit ${editTarget.username}`}
          submitLabel="Save"
          form={form}
          setForm={setForm}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          submitting={submitting}
          requirePassword={false}
          showUsername={false}
          showIsActive
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete approver?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently remove <strong>{deleteTarget.name}</strong> (
              <code>{deleteTarget.username}</code>) from <code>vis_approvers</code>. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Local toasts — useToast() state is per-component, so we render our own. */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ApproverModal({
  title,
  submitLabel,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
  requirePassword,
  showUsername,
  showIsActive,
}: {
  title: string;
  submitLabel: string;
  form: FormState;
  setForm: (f: FormState) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  requirePassword: boolean;
  showUsername: boolean;
  showIsActive: boolean;
}) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 my-8"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {showUsername && (
            <Field label="Username" required>
              <input
                type="text"
                required
                minLength={3}
                maxLength={50}
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                className="input"
              />
            </Field>
          )}
          <Field label="Full Name" required>
            <input
              type="text"
              required
              maxLength={255}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              maxLength={20}
              value={form.ph_no}
              onChange={(e) => set('ph_no', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Warehouse">
            <input
              type="text"
              maxLength={255}
              value={form.warehouse}
              onChange={(e) => set('warehouse', e.target.value)}
              className="input"
            />
          </Field>
          <Field
            label={requirePassword ? 'Password' : 'New Password (leave blank to keep)'}
            required={requirePassword}
          >
            <input
              type="password"
              required={requirePassword}
              minLength={requirePassword ? 8 : undefined}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.superuser}
              onChange={(e) => set('superuser', e.target.checked)}
            />
            <span>Superuser</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.admin}
              onChange={(e) => set('admin', e.target.checked)}
            />
            <span>Admin</span>
          </label>
          {showIsActive && (
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
              />
              <span>Active</span>
            </label>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </Button>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            padding: 0.375rem 0.625rem;
            font-size: 0.875rem;
            height: 2.25rem;
          }
          .input:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
            border-color: #3b82f6;
          }
        `}</style>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
