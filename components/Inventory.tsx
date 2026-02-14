
import React, { useMemo } from 'react';
import { User, Item } from '../types';
import { CLEANING_COST_RATIO, ROT_TIME_MS } from '../constants';

interface InventoryProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ user, onUpdateUser, onBack }) => {
  const sortedInventory = useMemo(() => {
    return [...user.inventory].sort((a: Item, b: Item) => a.name.localeCompare(b.name, 'ko'));
  }, [user.inventory]);

  const handleClean = (item: Item) => {
    const cost = Math.floor(item.basePrice * CLEANING_COST_RATIO);
    if (user.balance < cost) {
      alert('세척할 비용이 모자랍니다!');
      return;
    }

    if (confirm(`아이템을 세척하시겠습니까? (비용: ${cost.toLocaleString()}원)`)) {
      const updatedInventory = user.inventory.map((i: Item) =>
        i.id === item.id ? { ...i, isCleaned: true } : i
      );

      onUpdateUser({
        ...user,
        balance: user.balance - cost,
        inventory: updatedInventory
      });
      alert('아이템이 깨끗해졌습니다! 가치가 상승합니다.');
    }
  };

  const getStatus = (item: Item) => {
    const isRotten = item.isFood && item.purchaseTime && (Date.now() - item.purchaseTime > ROT_TIME_MS);
    const statuses = [];
    if (item.isCleaned) statuses.push('✨ 세척됨');
    if (isRotten) statuses.push('🤢 부패함');
    else if (item.isFood) statuses.push('🍎 신선함');
    return statuses.join(' | ') || '기본 상태';
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">나의 가방 🎒</h2>
        <span className="text-sm text-gray-500">모두 {user.inventory.length}개</span>
      </div>

      {sortedInventory.length === 0 ? (
        <div className="p-20 text-center text-gray-400">
          <p className="text-4xl mb-4">비어있음</p>
          <p className="text-sm">가방이 비어있습니다.</p>
          <p className="text-xs mt-1">장터에서 새로운 아이템을 찾아보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedInventory.map((item: Item) => (
            <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex gap-4">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-gray-50" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">{item.name}</h4>
                  <p className="text-xs text-gray-400 mb-1">{item.category}</p>
                  <p className="text-xs font-medium text-orange-500">{getStatus(item)}</p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-700">{(Number(item.basePrice * (item.isCleaned ? 2 : 1)) || 0).toLocaleString()}원</span>
                  {!item.isCleaned && (
                    <button
                      onClick={() => handleClean(item)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      씻기 ({Math.floor(Number(item.basePrice) * CLEANING_COST_RATIO).toLocaleString()}원)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
