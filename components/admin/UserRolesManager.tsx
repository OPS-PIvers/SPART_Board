import React, { useEffect, useState } from 'react';
import {
  Search,
  MoreVertical,
  Plus,
  Shield,
  GraduationCap,
  BookOpen,
  Mail,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile, UserRole } from '../../types';

export const UserRolesManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDept, setEditingDept] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const userList: UserProfile[] = [];
        snapshot.forEach((doc) => {
          userList.push(doc.data() as UserProfile);
        });
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      const user = users.find((u) => u.uid === userId);
      const email = user?.email?.toLowerCase();

      if (!email) {
        console.error('User has no email, cannot manage admin status');
        return;
      }

      // Update user role in users collection
      await updateDoc(userRef, { role: newRole });

      // If promoting to admin, add to admins collection
      if (newRole === 'admin') {
        const timestamp = new Date().getTime();
        await setDoc(doc(db, 'admins', email), {
          addedAt: timestamp,
          addedBy: 'admin_ui',
        });
      }
      // If demoting from admin, remove from admins collection
      else if (
        (user?.role as string) === 'admin' &&
        newRole !== ('admin' as UserRole)
      ) {
        const adminRef = doc(db, 'admins', email);
        const adminDoc = await getDoc(adminRef);
        if (adminDoc.exists()) {
          await deleteDoc(adminRef);
        }
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    }
  };

  const handleDepartmentUpdate = async (userId: string, department: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { department });
      setEditingDept(null);
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)
  );

  const formatLastActive = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Used in UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Used in UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3 mr-1" />;
      case 'teacher':
        return <BookOpen className="w-3 h-3 mr-1" />;
      case 'student':
        return <GraduationCap className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            User Access & Roles
          </h3>
          <p className="text-slate-600">
            Manage user permissions and role assignments.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-brand-blue-primary rounded-lg transition-all outline-none"
            />
          </div>
          <button
            onClick={() =>
              alert(
                'User invitations are not yet implemented. Users will appear here after they sign in.'
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-primary text-white rounded-lg hover:bg-brand-blue-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Current Role</th>
                <th className="px-6 py-4 font-semibold">Last Active</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className="group hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName ?? 'User'}
                            className="w-10 h-10 rounded-full border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                            <span className="text-lg font-bold text-slate-400">
                              {(user.displayName ?? user.email ?? '?')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {user.displayName ?? 'Unknown User'}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email ?? 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.uid,
                              e.target.value as UserRole
                            )
                          }
                          className="appearance-none bg-slate-800 border border-slate-700 text-white pl-3 pr-8 py-1.5 rounded-lg text-sm focus:outline-none focus:border-brand-blue-primary cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="student">Student</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {user.lastActive
                          ? formatLastActive(user.lastActive)
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingDept === user.uid ? (
                        <input
                          type="text"
                          defaultValue={user.department ?? ''}
                          autoFocus
                          onBlur={(e) =>
                            handleDepartmentUpdate(user.uid, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void handleDepartmentUpdate(
                                user.uid,
                                e.currentTarget.value
                              );
                            } else if (e.key === 'Escape') {
                              setEditingDept(null);
                            }
                          }}
                          className="bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded text-sm w-32 focus:outline-none focus:border-brand-blue-primary"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingDept(user.uid)}
                          className="cursor-pointer hover:text-white transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 group/badge"
                        >
                          <Building2 className="w-3 h-3" />
                          {user.department ?? 'No Dept'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        onClick={() => {
                          // Placeholder for future actions
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <div>
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div>{/* Pagination could go here */}</div>
        </div>
      </div>
    </div>
  );
};
