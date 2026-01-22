import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Users,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { userService, type User, type CreateUserDto } from '../services/userService';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  CREDIT_OFFICER: 'Credit Officer',
  FINANCE_OFFICER: 'Finance Officer',
  CLIENT: 'Client',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  CREDIT_OFFICER: 'bg-blue-100 text-blue-700 border-blue-200',
  FINANCE_OFFICER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLIENT: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CREDIT_OFFICER',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) =>
        statusFilter === 'active' ? u.isActive : !u.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      setTogglingUserId(user.id);
      await userService.updateUserStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleCreateUser = async () => {
    try {
      setCreateLoading(true);
      setCreateError('');
      const newUser = await userService.createUser(createForm);
      setUsers((prev) => [...prev, newUser]);
      setShowCreateDialog(false);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'CREDIT_OFFICER',
      });
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    officers: users.filter((u) => u.role === 'CREDIT_OFFICER' || u.role === 'FINANCE_OFFICER').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users & Roles</h1>
          <p className="text-sm text-slate-600">Manage system users and their access levels</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Officers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.officers}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="CREDIT_OFFICER">Credit Officer</SelectItem>
                <SelectItem value="FINANCE_OFFICER">Finance Officer</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('font-medium', ROLE_COLORS[user.role])}
                        >
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.lastLogin)}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingUserId === user.id}
                          className={cn(
                            user.isActive
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          )}
                        >
                          {togglingUserId === user.id
                            ? 'Updating...'
                            : user.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new system user with specified role and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createError && (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john.doe@kenelsbureau.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+254 7XX XXX XXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, role: value as CreateUserDto['role'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="CREDIT_OFFICER">Credit Officer</SelectItem>
                  <SelectItem value="FINANCE_OFFICER">Finance Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Min 8 chars, uppercase, lowercase, number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={
                createLoading ||
                !createForm.email ||
                !createForm.password ||
                !createForm.firstName ||
                !createForm.lastName
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
