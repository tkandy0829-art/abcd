
import React, { useState } from 'react';
import { User } from '../types';

interface AdminProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ users, onUpdateUsers, onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const handleSearch = () => {
    const found = users.find((u: User) => u.id === searchId);
    setSelectedUser(found || null);
    if (!found) alert('유저를 찾을 수 없습니다.');
  };

  const handleUpdateBalance = () => {
    if (!selectedUser) return;
    const amount = parseInt(editAmount);
    if (isNaN(amount)) return;

    const updated = users.map((u: User) => u.id === selectedUser.id ? { ...u, balance: amount } : u);
    onUpdateUsers(updated);
    setSelectedUser({ ...selectedUser, balance: amount });
    setEditAmount('');
    alert('보유 금액이 수정되었습니다.');
  };

  const toggleBan = () => {
    if (!selectedUser) return;
    if (selectedUser.isAdmin) {
      alert('관리자 계정은 벤할 수 없습니다.');
      return;
    }
    const newBanStatus = !selectedUser.isBanned;
    const updated = users.map((u: User) => u.id === selectedUser.id ? { ...u, isBanned: newBanStatus } : u);
    onUpdateUsers(updated);
    setSelectedUser({ ...selectedUser, isBanned: newBanStatus });
    alert(newBanStatus ? '유저를 벤했습니다.' : '유저 벤을 해제했습니다.');
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-red-600 tracking-tighter">관리자 패널 (어드민)</h2>
        <button onClick={onBack} className="text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors">닫기</button>
      </div>

      <div className="bg-white border-2 border-red-50 p-5 rounded-3xl flex flex-col gap-5 shadow-lg">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          유저 관리 시스템
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="아이디를 입력하세요"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-red-400 transition-all"
          />
          <button
            onClick={handleSearch}
            className="bg-red-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-red-600 active:scale-95 transition-all"
          >
            검색
          </button>
        </div>

        {selectedUser && (
          <div className="mt-2 p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 shadow-inner">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">유저 상태 (유저 스테이터스)</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-black text-lg text-gray-800">{selectedUser.id}</span>
                  {selectedUser.isBanned ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full">정지됨 (벤)</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-black rounded-full">정상 (액티브)</span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleBan}
                className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 ${selectedUser.isBanned
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
              >
                {selectedUser.isBanned ? '벤 해제' : '유저 벤'}
              </button>
            </div>

            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">잔액 관리 (밸런스 매니지먼트)</p>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₩</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder={selectedUser.balance.toLocaleString()}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-red-400"
                  />
                </div>
                <button
                  onClick={handleUpdateBalance}
                  className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">방문 기록 (로그인 히스토리)</p>
              <ul className="mt-1 space-y-1">
                {selectedUser.visitHistory.slice(-3).reverse().map((v: number, i: number) => (
                  <li key={i} className="text-[11px] text-gray-500 flex justify-between">
                    <span>{new Date(v).toLocaleDateString()}</span>
                    <span>{new Date(v).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2">
        <h3 className="text-xs font-black text-gray-400 mb-3 px-1 uppercase tracking-widest">전체 가입 유저 명단</h3>
        <div className="bg-white rounded-3xl border border-gray-100 p-2 shadow-sm max-h-60 overflow-y-auto no-scrollbar">
          <div className="flex flex-col">
            {users.map((u: User) => (
              <button
                key={u.id}
                onClick={() => {
                  setSearchId(u.id);
                  setSelectedUser(u);
                }}
                className={`flex justify-between items-center p-3 rounded-2xl transition-all hover:bg-gray-50 active:scale-[0.98] ${selectedUser?.id === u.id ? 'bg-red-50 border-red-100 border' : 'border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${u.isBanned ? 'bg-red-400' : 'bg-green-400'}`}></div>
                  <span className={`text-sm font-bold ${u.isBanned ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {u.id}
                  </span>
                  {u.isAdmin && (
                    <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black">관리자</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-800">{u.id === 'ltk2757' ? '∞' : u.balance.toLocaleString()}원</p>
                  <p className="text-[8px] text-gray-400 font-medium">
                    최근: {u.visitHistory.length > 0 ? new Date(u.visitHistory[u.visitHistory.length - 1]).toLocaleDateString() : '-'}
                  </p>
                </div>
              </button>
            ))}
            {users.length === 0 && (
              <p className="p-10 text-center text-xs text-gray-300">등록된 유저가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="text-xs font-black text-gray-400 mb-3 px-1 uppercase tracking-widest">시스템 전체 개요</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase">전체 유저 수</p>
            <p className="text-xl font-black text-gray-800 mt-1">{users.length}<span className="text-sm font-normal text-gray-400 ml-1">명</span></p>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[10px] text-gray-400 font-bold uppercase">전체 유통 자산</p>
            <p className="text-xl font-black text-gray-800 mt-1">
              {users.reduce((acc: number, u: User) => acc + u.balance, 0).toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-1">원</span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-300 font-medium mt-4">
        당근 중고거래 시뮬 마스터 전용 콘솔 v2.1
      </p>
    </div>
  );
};

export default Admin;
