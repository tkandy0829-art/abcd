
import React from 'react';
import { User } from '../types';

interface HomeProps {
  user: User;
  onNavigate: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, onNavigate }) => {
  const totalItemValue = user.inventory.reduce((acc: number, item: any) =>
    acc + (item.basePrice * (item.isCleaned ? 2 : 1)), 0
  );

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-[#ff8a3d] to-[#ffb17a] p-6 rounded-[2rem] text-white shadow-lg shadow-orange-100 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-bold opacity-80 mb-1">반가워요, {user.id}님!</p>
          <h2 className="text-2xl font-black mb-4">오늘도 활발한<br />거래 어떠신가요?</h2>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold opacity-70 uppercase">나의 총 자산 가치</p>
              <p className="text-xl font-black">{(Number(user.balance + totalItemValue) || 0).toLocaleString()}원</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold opacity-70 uppercase">보유 아이템</p>
              <p className="text-xl font-black">{user.inventory.length}개</p>
            </div>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
      </div>

      {/* Quick Menu */}
      <div className="grid grid-cols-2 gap-4">
        <MenuButton
          icon="🛍️"
          label="물건 사기"
          sub="저렴한 매물을 찾아요"
          onClick={() => onNavigate('buy')}
        />
        <MenuButton
          icon="🤝"
          label="물건 팔기"
          sub="비싸게 되팔아보세요"
          onClick={() => onNavigate('sell')}
        />
        <MenuButton
          icon="📦"
          label="나의 가방"
          sub="보유 아이템 관리"
          onClick={() => onNavigate('inventory')}
        />
        <MenuButton
          icon="🏆"
          label="부자 랭킹"
          sub="누가 가장 부자인가요?"
          onClick={() => onNavigate('ranking')}
        />
      </div>

      {/* Recent Activity Mini Section */}
      <div className="mt-2">
        <h3 className="text-sm font-black text-gray-800 mb-3 px-1">최근 접속 기록</h3>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
          {user.visitHistory.slice(-3).reverse().map((time: number, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">
                {idx === 0 ? '최근 접속' : `${idx + 1}번째 전 접속`}
              </span>
              <span className="text-gray-400">
                {new Date(time).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MenuButtonProps {
  icon: string;
  label: string;
  sub: string;
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, sub, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white border border-gray-50 p-5 rounded-3xl flex flex-col items-start gap-1 shadow-sm hover:shadow-md hover:border-orange-100 transition-all group active:scale-95"
  >
    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
    <span className="font-black text-gray-800 text-sm">{label}</span>
    <span className="text-[10px] text-gray-400 font-medium leading-tight">{sub}</span>
  </button>
);

export default Home;
