import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import LabourForm from '../components/labour/LabourForm.jsx';
import { labourService } from '../services/labourService.js';
import { authService } from '../services/authService.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  getLabourRateLabel,
  getLabourRateValue,
  getLabourTypeLabel,
  getSalaryBasisLabel,
  normalizeLabourType
} from '../utils/labour.js';
import { ADMIN_ROLES, LABOUR_TYPES } from '../utils/constants.js';

const defaultAdminForm = {
  name: '',
  email: '',
  password: '',
  role: 'manager'
};

function LaboursPage() {
  const { admin } = useAuth();

  const isSuperAdmin = admin?.role === ADMIN_ROLES.SUPER_ADMIN;
  const canAddLabour = isSuperAdmin;
  const canEditDeleteLabour = isSuperAdmin || admin?.role === ADMIN_ROLES.ADMIN;
  const canManageAdmins = isSuperAdmin;

  const [search, setSearch] = useState('');
  const [labours, setLabours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [isSavingLabour, setIsSavingLabour] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState(defaultAdminForm);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);

  useEffect(() => {
    document.title = 'Labours | Labour Attendance';
  }, []);

  const loadLabours = async () => {
    try {
      setIsLoading(true);
      const response = await labourService.getLabours(search);
      setLabours(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch labours');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdmins = async () => {
    if (!canManageAdmins) {
      setAdmins([]);
      return;
    }

    try {
      const response = await authService.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch admins');
    }
  };

  useEffect(() => {
    loadLabours();
  }, [search]);

  useEffect(() => {
    loadAdmins();
  }, [canManageAdmins]);

  const handleSaveLabour = async (payload) => {
    if (!selectedLabour) {
      toast.error('Select a labour record to edit.');
      return;
    }

    if (!canEditDeleteLabour) {
      toast.error('You do not have permission to edit labour.');
      return;
    }

    try {
      setIsSavingLabour(true);
      await labourService.updateLabour(selectedLabour._id, payload);
      toast.success('Labour updated successfully');
      setIsEditModalOpen(false);
      setSelectedLabour(null);
      await loadLabours();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save labour');
    } finally {
      setIsSavingLabour(false);
    }
  };

  const handleDeleteLabour = async (id) => {
    if (!canEditDeleteLabour) {
      toast.error('You do not have permission to delete labour.');
      return;
    }

    const confirmed = window.confirm('Delete this labour? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await labourService.deleteLabour(id);
      toast.success('Labour deleted successfully');
      await loadLabours();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete labour');
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    if (!canManageAdmins) {
      toast.error('Only super admin can manage admin accounts.');
      return;
    }

    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }

    try {
      setIsSavingAdmin(true);
      await authService.createAdmin({
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
        role: adminForm.role
      });
      toast.success('Admin created successfully');
      setAdminForm(defaultAdminForm);
      await loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create admin');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminRecord) => {
    if (!canManageAdmins) {
      toast.error('Only super admin can manage admin accounts.');
      return;
    }

    if (adminRecord.role === ADMIN_ROLES.SUPER_ADMIN) {
      toast.error('Super admin account cannot be deleted.');
      return;
    }

    if (adminRecord._id === admin?.id) {
      toast.error('You cannot delete your own account.');
      return;
    }

    const confirmed = window.confirm(`Delete ${adminRecord.name} (${adminRecord.role.replace('_', ' ')})?`);
    if (!confirmed) return;

    try {
      setDeletingAdminId(adminRecord._id);
      await authService.deleteAdmin(adminRecord._id);
      toast.success('Admin deleted successfully');
      await loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete admin');
    } finally {
      setDeletingAdminId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="page-heading">Labour Directory</h1>
        <p className="page-subtitle">Manage labour profiles, contract/salary details, and user access in one place.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <Input
            label="Search Labour"
            placeholder="Search by name or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:w-80"
          />
          {canAddLabour ? (
            <Link to="/labours/add">
              <Button>Add Labour</Button>
            </Link>
          ) : null}
        </div>

        {!canAddLabour ? (
          <p className="mt-2 text-sm text-slate-500">
            {canEditDeleteLabour
              ? 'Admin role can edit/delete labour but cannot add new labour.'
              : 'Manager role has read-only access to labour records.'}
          </p>
        ) : null}

        <div className="table-shell mt-4">
          <table className="data-table">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-3">Name</th>
                <th className="px-2 py-3">Phone</th>
                <th className="px-2 py-3">Section</th>
                <th className="px-2 py-3">Category</th>
                <th className="px-2 py-3">Salary Type</th>
                <th className="px-2 py-3">Rate</th>
                <th className="px-2 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={7} className="px-2 py-2">
                      <Skeleton className="h-10" />
                    </td>
                  </tr>
                ))
              ) : labours.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4">
                    <EmptyState message="No labour records found." />
                  </td>
                </tr>
              ) : (
                labours.map((labour) => (
                  <tr key={labour._id} className="text-sm">
                    <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100">{labour.name}</td>
                    <td className="px-2 py-2">{labour.phone}</td>
                    <td className="px-2 py-2">{labour.section || '-'}</td>
                    <td className="px-2 py-2">{getLabourTypeLabel(labour.labourType)}</td>
                    <td className="px-2 py-2">
                      {normalizeLabourType(labour.labourType) === LABOUR_TYPES.SALARY_BASED
                        ? getSalaryBasisLabel(labour.salaryBasis)
                        : '-'}
                    </td>
                    <td className="px-2 py-2">
                      {getLabourRateLabel(labour)}: ₹{getLabourRateValue(labour)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/labour/${labour._id}`}
                          className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                        >
                          View
                        </Link>
                        {canEditDeleteLabour ? (
                          <>
                            <Button
                              variant="secondary"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => {
                                setSelectedLabour(labour);
                                setIsEditModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => handleDeleteLabour(labour._id)}
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">Read only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {canManageAdmins ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Multi-Admin Management</h2>
          <p className="mt-1 text-sm text-slate-500">Super admin can create or delete admin and manager accounts.</p>

          <form className="mt-4 grid gap-3 lg:grid-cols-5" onSubmit={handleCreateAdmin}>
            <Input
              label="Name"
              value={adminForm.name}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              value={adminForm.email}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              label="Password"
              type="password"
              value={adminForm.password}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Role</span>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={adminForm.role}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isSavingAdmin}>
                {isSavingAdmin ? 'Creating...' : 'Create Admin'}
              </Button>
            </div>
          </form>

          <div className="table-shell mt-4">
            <table className="data-table">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Role</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-sm text-slate-500">
                      No admin accounts found.
                    </td>
                  </tr>
                ) : (
                  admins.map((adminRecord) => {
                    const isSelf = adminRecord._id === admin?.id;
                    const canDelete = adminRecord.role !== ADMIN_ROLES.SUPER_ADMIN && !isSelf;

                    return (
                      <tr key={adminRecord._id} className="text-sm">
                        <td className="px-2 py-2">{adminRecord.name}</td>
                        <td className="px-2 py-2">{adminRecord.email}</td>
                        <td className="px-2 py-2 uppercase tracking-wide">{adminRecord.role.replace('_', ' ')}</td>
                        <td className="px-2 py-2">
                          {isSelf ? (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">You</span>
                          ) : canDelete ? (
                            <Button
                              variant="danger"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => handleDeleteAdmin(adminRecord)}
                              disabled={deletingAdminId === adminRecord._id}
                            >
                              {deletingAdminId === adminRecord._id ? 'Deleting...' : 'Delete'}
                            </Button>
                          ) : (
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {canEditDeleteLabour ? (
        <Modal
          title="Edit Labour"
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLabour(null);
          }}
        >
          <LabourForm
            initialValues={selectedLabour || undefined}
            onSubmit={handleSaveLabour}
            isSubmitting={isSavingLabour}
            submitLabel="Update Labour"
          />
        </Modal>
      ) : null}
    </section>
  );
}

export default LaboursPage;
