import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Plus,
  KeyRound,
  CheckCircle,
  XCircle,
  Users,
  GraduationCap,
  User as UserIcon,
  Edit2,
  Trash2,
  Lock,
  Filter
} from 'lucide-react';
import { User, School, UserRole } from '../../types';
import { AppStorage } from '../../services/storage';
import { Modal } from '../../components/Modal';

interface ManajemenAkunViewProps {
  users: User[];
  schools: School[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ManajemenAkunView: React.FC<ManajemenAkunViewProps> = ({
  users,
  schools,
  onRefresh,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [password, setPassword] = useState('password123');
  const [schoolId, setSchoolId] = useState(schools[0]?.id || '');
  const [isActive, setIsActive] = useState(true);

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setUsername('');
    setFullName('');
    setRole('admin');
    setPassword('password123');
    setSchoolId(schools[0]?.id || '');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setRole(u.role);
    setPassword('');
    setSchoolId(u.schoolId || schools[0]?.id || '');
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName) return;

    // Check duplicate username
    const exists = users.some(
      u => u.username.toLowerCase() === username.toLowerCase() && u.id !== selectedUser?.id
    );
    if (exists) {
      showToast('error', 'Username Sudah Dipakai', `Username ${username} telah digunakan akun lain.`);
      return;
    }

    const schoolObj = schools.find(s => s.id === schoolId);

    const userToSave: User = {
      id: selectedUser ? selectedUser.id : 'usr-' + Date.now(),
      username: username.trim().toLowerCase(),
      password: password || selectedUser?.password || 'password123',
      role,
      fullName: fullName.trim(),
      schoolId: role !== 'admin' ? schoolId : undefined,
      schoolName: role !== 'admin' ? schoolObj?.name : undefined,
      isActive,
      createdAt: selectedUser?.createdAt || new Date().toISOString().slice(0, 10)
    };

    AppStorage.saveUser(userToSave);
    AppStorage.logActivity('Admin Kecamatan', 'admin', selectedUser ? 'Edit Akun' : 'Tambah Akun', `Menyimpan akun ${userToSave.username} (${userToSave.role})`);
    setIsModalOpen(false);
    onRefresh();
    showToast('success', 'Akun Disimpan', `Akun untuk ${userToSave.fullName} berhasil diperbarui.`);
  };

  const handleToggleActive = (u: User) => {
    const updated = { ...u, isActive: !u.isActive };
    AppStorage.saveUser(updated);
    onRefresh();
    showToast('success', 'Status Berubah', `Akun ${u.username} sekarang ${updated.isActive ? 'Aktif' : 'Nonaktif'}.`);
  };

  const handleResetPassword = (u: User) => {
    const updated = { ...u, password: 'password123' };
    AppStorage.saveUser(updated);
    showToast('success', 'Password Direset', `Password ${u.username} direset ke: password123`);
  };

  const handleDelete = (u: User) => {
    if (window.confirm(`Yakin ingin menghapus akun "${u.username}"?`)) {
      AppStorage.deleteUser(u.id);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Akun', `Menghapus akun ${u.username}`);
      onRefresh();
      showToast('info', 'Akun Dihapus', `Akun ${u.username} telah dihapus.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Manajemen Akun & Keamanan Akses Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan seluruh akun pengguna (Admin Kecamatan, Guru, Siswa), hak akses, dan reset sandi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun Pengguna
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari username atau nama pengguna..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Peran ({users.length} Akun)</option>
            <option value="admin">Admin Kecamatan</option>
            <option value="guru">Guru Pengampu</option>
            <option value="siswa">Siswa Peserta CBT</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Hak Akses / Peran</th>
                <th className="py-3 px-4">Satuan Pendidikan</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-center">Aksi Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-900">{u.username}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.fullName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : u.role === 'guru'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{u.schoolName || 'Kecamatan (Semua)'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Reset Sandi ke password123"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit Akun"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
        subtitle="Atur username, sandi, dan tingkat kewenangan sistem"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Contoh: admin_ops"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peran / Hak Akses *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold"
              >
                <option value="admin">Admin Kecamatan</option>
                <option value="guru">Guru Pengampu</option>
                <option value="siswa">Siswa Peserta CBT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Pengguna *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Contoh: Drs. H. Bambang Irawan"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
            />
          </div>

          {role !== 'admin' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan Pendidikan / Sekolah *</label>
              <select
                value={schoolId}
                onChange={e => setSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {selectedUser ? 'Ubah Sandi Baru (Kosongkan jika tidak diubah)' : 'Sandi Awal *'}
            </label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password123"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
            >
              Simpan Akun
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
