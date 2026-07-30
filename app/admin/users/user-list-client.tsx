"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  UserPlus,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import type { UserPublic, UserRole } from "@/lib/auth-types";
import { USER_ROLES, ROLE_LABELS, ROLE_LABELS_EN } from "@/lib/auth-types";

interface UserListClientProps {
  users: UserPublic[];
  currentUserId: string;
  canCreate: boolean;
  canEditRole: boolean;
}

export default function UserListClient({
  users,
  currentUserId,
  canCreate,
  canEditRole,
}: UserListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "writer" as UserRole,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setFormData({ email: "", name: "", password: "", role: "writer" });
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`สร้างผู้ใช้ "${formData.name}" สำเร็จ`);
        resetForm();
        setShowCreateModal(false);
        router.refresh();
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setSuccess("อัปเดตบทบาทสำเร็จ");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update role");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`แน่ใจว่าต้องการลบผู้ใช้ "${userName}"?`)) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess(`ลบผู้ใช้ "${userName}" สำเร็จ`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-amber-300/20 text-amber-300";
      case "editor":
        return "bg-emerald-300/20 text-emerald-300";
      case "writer":
        return "bg-blue-300/20 text-blue-300";
      case "unassigned":
        return "bg-white/10 text-white/40";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-white">ผู้ใช้งานทั้งหมด</h1>
          <p className="text-white/50 text-sm mt-1">
            จัดการผู้ใช้งานระบบ ({users.length} คน)
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all"
          >
            <UserPlus size={18} />
            เพิ่มผู้ใช้ใหม่
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm mb-4">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm mb-4">
          <Check size={16} />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาผู้ใช้..."
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">ผู้ใช้</th>
                <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider hidden md:table-cell">อีเมล</th>
                <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">บทบาท</th>
                <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider hidden lg:table-cell">สมัครเมื่อ</th>
                <th className="text-right px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/40">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    ไม่พบผู้ใช้
                  </td>
                </tr>
              ) : (
                filtered.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-300/20 flex items-center justify-center text-amber-300 text-xs font-bold">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {userItem.name}
                            {userItem.id === currentUserId && (
                              <span className="text-amber-300/60 text-[10px] ml-2">(คุณ)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm hidden md:table-cell">
                      {userItem.email}
                    </td>
                    <td className="px-4 py-3">
                      {canEditRole ? (
                        <select
                          value={userItem.role}
                          onChange={(e) =>
                            handleUpdateRole(userItem.id, e.target.value as UserRole)
                          }
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border-0 cursor-pointer ${getRoleBadgeColor(userItem.role)} bg-opacity-100`}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getRoleBadgeColor(userItem.role)}`}>
                          {ROLE_LABELS[userItem.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-sm hidden lg:table-cell">
                      {new Date(userItem.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(userItem);
                            setFormData({
                              email: userItem.email,
                              name: userItem.name,
                              password: "",
                              role: userItem.role,
                            });
                          }}
                          className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-amber-300 transition-all"
                          title="แก้ไข"
                        >
                          <Edit2 size={14} />
                        </button>
                        {userItem.id !== currentUserId && (
                          <button
                            onClick={() => handleDelete(userItem.id, userItem.name)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-all"
                            title="ลบ"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">เพิ่มผู้ใช้ใหม่</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">ชื่อ</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
                  placeholder="ชื่อผู้ใช้"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">อีเมล</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">บทบาท</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-300/50 text-sm"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]} ({ROLE_LABELS_EN[role]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50 text-sm"
                >
                  {loading ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-gradient-to-br from-[#0f1f3a] to-[#162545] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">แก้ไขผู้ใช้</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                }}
                className="text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);

                try {
                  const updates: any = {};
                  if (formData.name) updates.name = formData.name;
                  if (formData.password) updates.password = formData.password;

                  const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                  });

                  if (res.ok) {
                    setSuccess("อัปเดตผู้ใช้สำเร็จ");
                    setEditingUser(null);
                    resetForm();
                    router.refresh();
                  } else {
                    const data = await res.json();
                    setError(data.error || "Failed to update user");
                  }
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white/70 text-sm mb-1">ชื่อ</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-300/50 text-sm"
                  placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-semibold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50 text-sm"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
