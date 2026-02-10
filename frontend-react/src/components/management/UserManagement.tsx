'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Users,
    UserPlus,
    Pencil,
    Trash2,
    Shield,
    ShieldAlert,
    Mail,
    User,
    Loader2,
    Search,
    X,
    KeyRound,
    Clock,
    UserCircle2
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin';
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'admin'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users/admins');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (user: any = null) => {
        if (!isSuperAdmin) return;
        if (user) {
            setSelectedUser(user);
            setFormData({
                username: user.username,
                name: user.name,
                email: user.email || '',
                password: '', // Don't show existing password
                role: user.role
            });
        } else {
            setSelectedUser(null);
            setFormData({
                username: '',
                name: '',
                email: '',
                password: '',
                role: 'admin'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (selectedUser) {
                // Update
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    username: formData.username
                };
                if (formData.password) updateData.password = formData.password;
                await api.put(`/users/admins/${selectedUser.id}`, updateData);
            } else {
                // Create
                await api.post('/users/admins', formData);
            }
            fetchUsers();
            handleCloseModal();
        } catch (err: any) {
            console.error('Failed to save user:', err);
            alert(err.response?.data?.message || 'فشل في حفظ بيانات المستخدم');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!isSuperAdmin) return;
        if (Number(userId) === Number(currentUser?.id)) {
            alert('لا يمكنك حذف حسابك الخاص');
            return;
        }
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

        try {
            await api.delete(`/users/admins/${userId}`);
            fetchUsers();
        } catch (err) {
            console.error('Failed to delete user:', err);
            alert('فشل في حذف المستخدم');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground">إدارة المستخدمين</h3>
                        <p className="text-sm text-secondary/60 font-medium">قائمة الموظفين والمسؤولين في النظام</p>
                    </div>
                </div>
                {isSuperAdmin && (
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 h-12 font-bold"
                        icon={<UserPlus size={20} />}
                    >
                        إضافة موظف
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40" size={18} />
                <input
                    type="text"
                    placeholder="بحث باسم الموظف أو اسم المستخدم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-black/5 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
            </div>

            {/* Users Table / List */}
            <div className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden">
                <div className="divide-y divide-black/5">
                    {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 md:p-6 hover:bg-primary/[0.02] transition-colors group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center font-black text-secondary/60 border border-black/5">
                                        {u.name[0]?.toUpperCase() || <UserCircle2 size={24} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-black text-foreground truncate">{u.name}</h4>
                                            <Badge
                                                variant={u.role === 'superadmin' ? 'warning' : 'primary'}
                                                className={cn(
                                                    "text-[10px] py-0 px-2 rounded-lg font-black uppercase tracking-wider h-5 flex items-center",
                                                    u.role === 'superadmin' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary/5 text-primary border-primary/10'
                                                )}
                                            >
                                                {u.role === 'superadmin' ? 'Super Admin' : 'Staff'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-secondary/40">
                                            <span className="flex items-center gap-1.5"><User size={12} className="text-secondary/20" />@{u.username}</span>
                                            {u.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-secondary/20" />{u.email}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 pr-16 md:pr-0">
                                    <div className="flex flex-col items-start md:items-center gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/20 flex items-center gap-1">
                                            <Clock size={10} /> آخر ظهور
                                        </span>
                                        <span className="text-xs font-black text-secondary/60">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('ar-EG') : 'غير متوفر'}
                                        </span>
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal(u)}
                                                className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-secondary/40 hover:bg-primary hover:text-white hover:border-primary transition-all"
                                                title="تعديل"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            {u.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-secondary/40 hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center text-secondary/40 font-bold">
                            لا يوجد مستخدمين مطابقين للبحث
                        </div>
                    )}
                </div>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <Card variant="glass" className="max-w-md w-full bg-white/95 backdrop-blur-md border border-black/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <CardHeader className="border-b border-black/5 flex flex-row items-center justify-between">
                            <CardTitle className="font-black">
                                {selectedUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                            </CardTitle>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-black/5 rounded-full transition-all">
                                <X size={20} className="text-secondary/40" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mr-1">اسم الموظف</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white border border-black/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="الاسم الثلاثي..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mr-1">اسم المستخدم</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-white border border-black/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="username..."
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mr-1">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white border border-black/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="example@laapak.com"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mr-1 flex items-center gap-1">
                                        {selectedUser ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                                        {selectedUser && <span className="text-[9px] font-medium text-secondary/40 italic">(اختياري)</span>}
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/20" size={16} />
                                        <input
                                            required={!selectedUser}
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-white border border-black/5 rounded-xl pr-10 pl-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 pb-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mr-1">الصلاحيات</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-white border border-black/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    >
                                        <option value="admin">موظف (Admin)</option>
                                        <option value="superadmin">مدير نظام (Super Admin)</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        className="flex-1 rounded-2xl h-12 font-bold"
                                        disabled={isSaving}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-primary text-white rounded-2xl h-12 font-bold"
                                        disabled={isSaving}
                                        icon={isSaving ? <Loader2 className="animate-spin" size={20} /> : undefined}
                                    >
                                        {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
