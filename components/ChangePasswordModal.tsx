import React, { useState } from 'react';
import { X, Lock, Save } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPasswordHash: string; // Passing current password for verification
  onSave: (newPassword: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, currentPasswordHash, onSave }) => {
  if (!isOpen) return null;

  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (current !== currentPasswordHash) {
      setError('当前密码错误');
      return;
    }

    if (newPass.length < 4) {
      setError('新密码至少需要4个字符');
      return;
    }

    if (newPass !== confirm) {
      setError('两次输入的新密码不一致');
      return;
    }

    onSave(newPass);
    onClose();
    // Reset fields
    setCurrent('');
    setNewPass('');
    setConfirm('');
    alert('密码修改成功，请谨记新密码。');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-semibold flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            修改管理密码
          </h3>
          <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">当前密码</label>
            <input 
              type="password" 
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="输入当前使用的密码"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
            <input 
              type="password" 
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="最少4个字符"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">确认新密码</label>
            <input 
              type="password" 
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="再次输入新密码"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100 flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-2"
            >
              取消
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              保存密码
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;