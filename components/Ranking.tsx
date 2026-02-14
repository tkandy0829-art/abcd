
import React, { useState, useMemo } from 'react';
import { User } from '../types';

interface RankingProps {
  users: User[];
  onBack: () => void;
}

const Ranking: React.FC<RankingProps> = ({ users, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 모든 사람을 돈 많은 순서로 줄 세우기 (가장 앞 50명)
  const rankedUsers = useMemo(() => {
    return [...users]
      .sort((a: User, b: User) => b.balance - a.balance)
      .slice(0, 50);
  }, [users]);

  // 찾기 걸러내기
  const filteredRankings = useMemo(() => {
    if (!searchTerm.trim()) return rankedUsers;
    return rankedUsers.filter((u: User) =>
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rankedUsers, searchTerm]);

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-yellow-500 font-black text-lg';
    if (index === 1) return 'text-gray-400 font-black text-lg';
    if (index === 2) return 'text-orange-400 font-black text-lg';
    return 'text-gray-400 font-medium text-sm';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-6 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">돈 많은 이 등수 🏆</h2>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="이름으로 등수 찾기..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-200 outline-none transition-all"
          />
          <span className="absolute left-3 top-3.5 text-gray-400">👀</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredRankings.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-4xl mb-2">🤷‍♂️</p>
            <p className="text-sm">등수에 그 사람이 없습니다.</p>
          </div>
        ) : (
          filteredRankings.map((u: User, idx: number) => {
            // 원본 랭킹에서의 순위 찾기 (검색 결과에서도 실제 순위 표시 위함)
            const actualRank = rankedUsers.findIndex((orig: User) => orig.id === u.id);

            return (
              <div
                key={u.id}
                className={`bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-orange-100 transition-all flex items-center gap-4 ${actualRank < 3 ? 'ring-1 ring-orange-50' : ''
                  }`}
              >
                <div className={`w-10 text-center ${getRankColor(actualRank)}`}>
                  {getRankBadge(actualRank)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{u.id}</h4>
                  보물 {u.inventory.length}개 가짐
                </div>

                <div className="text-right">
                  <p className="font-black text-orange-600">
                    {(Number(u.balance) || 0).toLocaleString()}원
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          지금 바로 가진 돈을 바탕으로 가장 앞 50명만 보여줍니다
        </p>
      </div>
    </div>
  );
};

export default Ranking;
