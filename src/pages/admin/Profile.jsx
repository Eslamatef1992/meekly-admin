import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

export default function Profile() {
  const user = useAuthStore(s => s.user);
  const branches = useAuthStore(s => s.branches);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const pwdMut = useMutation({
    mutationFn: () => api.post('/api/users/me/change-password', { current_password: cur, new_password: next }).then(r => r.data),
    onSuccess: () => { toast.success('Password changed'); setCur(''); setNext(''); setConfirm(''); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const submit = () => {
    if (!cur || !next || !confirm) return toast.error('Fill all fields');
    if (next !== confirm) return toast.error('Passwords do not match');
    if (next.length < 8) return toast.error('Password must be at least 8 characters');
    pwdMut.mutate();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Account Information</h3></div>
        <div className="card-body grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-gray-500">Name</div><div className="font-medium">{user?.full_name}</div></div>
          <div><div className="text-gray-500">Email</div><div className="font-mono">{user?.email}</div></div>
          <div>
            <div className="text-gray-500">Roles</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(user?.roles || []).map(r => <span key={r} className="badge-blue text-xs">{r}</span>)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Branches</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(branches || []).map(b => <span key={b.id} className="badge-gray text-xs">{b.name}</span>)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Permissions ({(user?.perms || []).length})</div>
            <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 grid grid-cols-2 gap-1">
              {(user?.perms || []).map(p => <div key={p} className="text-xs font-mono text-gray-600">{p}</div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Change Password</h3></div>
        <div className="card-body grid grid-cols-1 gap-3">
          <div><label className="label">Current Password</label><input type="password" className="input" value={cur} onChange={e => setCur(e.target.value)} /></div>
          <div><label className="label">New Password (min 8 chars)</label><input type="password" className="input" value={next} onChange={e => setNext(e.target.value)} /></div>
          <div><label className="label">Confirm New Password</label><input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
          <button className="btn-primary" onClick={submit} disabled={pwdMut.isPending}><KeyRound size={14}/> Change Password</button>
        </div>
      </div>
    </div>
  );
}
