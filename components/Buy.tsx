
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Item, NegotiationState, NPCPersonality, ChatMessage } from '../types';
import { getNPCResponse } from '../groqService';
import { aiMarketService } from '../aiMarketService';

interface BuyProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
  onNegotiationUpdate?: (item: Item | null, price: number) => void;
}

export const CATEGORIES = ['전자기기', '의류', '가구', '도서', '식품', '취미', '생활가전', '반려동물', '스포츠', '뷰티', '잡화', '주방용품', '악세서리', '식물'];
export const ADJECTIVES = ['고급', '낡은', '미개봉', '빈티지', '감성', '실속형', '한정판', '레트로', '튼튼한', '심플한', '유니크한', '클래식한', '트렌디한', '가성비', '귀여운'];
export const NOUNS = [
  '에어팟', '아이패드', '맥북', '롱패딩', '원목 책상', '소설 전집', '수제 쿠키', '레고 세트', '공기청정기', '강아지 사료',
  '테니스 라켓', '수분 크림', '모니터', '자전거', '게이밍 체어', '커피 머신', '헤드폰', '운동화', '캠핑 텐트', '블루투스 스피커',
  '삼각김밥', '컵라면', '초코바', '생수', '포테이토칩', '캔커피', '토스트', '도넛', '샌드위치', '우유'
];

// Hardcoded list removed. Data will be fetched from Supabase.

type SortOrder = 'latest' | 'price-asc' | 'price-desc';

const Buy: React.FC<BuyProps> = ({ user, onUpdateUser, onBack, onNegotiationUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [negotiation, setNegotiation] = useState<NegotiationState | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const dbItems = await aiMarketService.getMarketItems();
        const mappedItems: Item[] = dbItems.map((i: any) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          basePrice: i.basePrice,
          isFood: i.isFood,
          isCleaned: false,
          image: i.image || `https://picsum.photos/seed/${i.id}/200/200`,
          stock: i.stock
        }));
        setItems(mappedItems);
      } catch (err) {
        console.error("Failed to load items", err);
      } finally {
        setListLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let list = [...items];
    if (searchTerm.trim()) {
      list = list.filter((item: Item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (sortOrder) {
      case 'price-asc': list.sort((a: Item, b: Item) => a.basePrice - b.basePrice); break;
      case 'price-desc': list.sort((a: Item, b: Item) => b.basePrice - a.basePrice); break;
      default: break;
    }
    return list;
  }, [items, searchTerm, sortOrder]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [negotiation?.messages, isLoading]);

  useEffect(() => {
    if (onNegotiationUpdate) {
      onNegotiationUpdate(negotiation?.item || null, negotiation?.currentPriceOffer || 0);
    }
  }, [negotiation, onNegotiationUpdate]);

  const startNegotiation = (item: Item) => {
    const rand = Math.random();
    let personality = NPCPersonality.NORMAL;
    if (rand < 0.2) personality = NPCPersonality.KIND;
    else if (rand < 0.7) personality = NPCPersonality.NORMAL;
    else if (rand < 0.8) personality = NPCPersonality.STRANGE;
    else personality = NPCPersonality.RUDE;

    setNegotiation({
      active: true,
      item: { ...item },
      npcPersonality: personality,
      currentPriceOffer: Number(item.basePrice),
      messages: [{
        sender: 'npc',
        text: `안녕하세요! '${item.name}' 보고 계시네요. ${(Number(item.basePrice) || 0).toLocaleString()}원인데 가져가실래요?`,
        timestamp: Date.now()
      }],
      mode: 'buy'
    });
    setHasError(false);
  };

  const handleSendMessage = async () => {
    if (!negotiation || !inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    const newMessages: ChatMessage[] = [...negotiation.messages, { sender: 'user', text: userText, timestamp: Date.now() }];
    setNegotiation({ ...negotiation, messages: newMessages });
    setInputText('');
    setHasError(false);

    if (userText === "네 알겠습니다") {
      completeTransaction();
      return;
    }

    setIsLoading(true);
    const response = await getNPCResponse(
      'buy',
      negotiation.item,
      negotiation.npcPersonality,
      userText,
      negotiation.currentPriceOffer,
      newMessages
    );
    setIsLoading(false);

    if (response.isError) {
      setHasError(true);
    }

    const parsedPrice = Number(response.newPrice);
    const finalNewPrice = isNaN(parsedPrice) ? negotiation.currentPriceOffer : parsedPrice;

    setNegotiation({
      ...negotiation,
      currentPriceOffer: finalNewPrice,
      messages: [...newMessages, { sender: 'npc', text: response.text, timestamp: Date.now() }]
    });
  };

  const completeTransaction = async () => {
    if (!negotiation) return;
    const finalPrice = Number(negotiation.currentPriceOffer);
    const currentBalance = Number(user.balance);

    if (currentBalance < finalPrice) {
      alert('잔액이 부족합니다!');
      return;
    }

    try {
      // 1. 재고 차감 (Stock Management)
      await aiMarketService.updateStock(negotiation.item.id, -1);

      const newItem: Item = {
        ...negotiation.item,
        id: `owned-${Date.now()}`,
        originalId: negotiation.item.id,
        purchaseTime: negotiation.item.isFood ? Date.now() : undefined,
      };

      onUpdateUser({
        ...user,
        balance: currentBalance - finalPrice,
        inventory: [...user.inventory, newItem]
      });
      alert(`구매 완료! ${negotiation.item.name}이 재고에 추가되었습니다.`);
      if (onNegotiationUpdate) onNegotiationUpdate(null, 0);
      onBack();
    } catch (err) {
      alert('거래 처리 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    }
  };

  if (negotiation) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
          <div className="w-10"></div>
          <div className="text-center flex-1 mx-4">
            <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{negotiation.item.name}</h3>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">당근 이웃(판매자)</p>
          </div>
          <button onClick={() => onBack()} className="text-red-500 font-medium text-sm">포기</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
          {negotiation.messages.map((m: ChatMessage, idx: number) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-[#ff8a3d] text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border px-4 py-2 rounded-2xl text-xs text-gray-400 animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></span>
                <span>이웃이 고민 중...</span>
              </div>
            </div>
          )}
          {hasError && (
            <div className="flex justify-center my-4">
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-[11px] font-bold border border-red-100 shadow-sm text-center">
                ⚠️ 서버가 바빠서 대답을 못하고 있어요 (Quota Exceeded).<br />
                잠시 기다리거나, "홈으로"를 눌러 직전 가격으로 구매할 수 있습니다.
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-3 border-t flex flex-col gap-2 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center px-2 mb-1">
            <span className="text-xs text-gray-400 font-medium tracking-tight">현재 합의된 가격</span>
            <span className="text-sm font-black text-orange-600">{(Number(negotiation.currentPriceOffer) || 0).toLocaleString()}원</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              placeholder={isLoading ? "상대방의 대답을 기다리는 중..." : "메시지를 입력하세요 (예: 깎아주세요)"}
              className="flex-1 px-4 py-2 bg-gray-50 rounded-xl outline-none text-sm border focus:border-orange-200 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="bg-[#ff8a3d] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform disabled:bg-gray-300"
            >
              전송
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1">거래를 끝내려면 "네 알겠습니다"를 입력하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="2,000개의 보물 중 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-orange-300 transition-all"
          />
          <span className="absolute left-3 top-3.5 text-gray-400 text-lg">🔍</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <SortChip label="최신순" active={sortOrder === 'latest'} onClick={() => setSortOrder('latest')} />
          <SortChip label="저가순" active={sortOrder === 'price-asc'} onClick={() => setSortOrder('price-asc')} />
          <SortChip label="고가순" active={sortOrder === 'price-desc'} onClick={() => setSortOrder('price-desc')} />
        </div>
      </div>

      <div className="flex-1 space-y-3 pb-10">
        <p className="text-[11px] text-gray-400 px-1 font-bold">검색 결과: {filteredAndSortedItems.length}개</p>
        {filteredAndSortedItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-300 gap-2">
            <span className="text-5xl">🤷‍♂️</span>
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredAndSortedItems.map((item: Item) => (
            <div key={item.id} className="bg-white border border-gray-50 p-4 rounded-2xl shadow-sm flex gap-4 items-center hover:border-orange-100 transition-all group active:scale-[0.98]">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-gray-50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.category}</span>
                  {item.isFood && <span className="text-[10px] bg-green-50 px-1.5 py-0.5 rounded text-green-600 font-bold">FOOD</span>}
                </div>
                <p className="font-bold text-orange-600 mt-1">{(Number(item.basePrice) || 0).toLocaleString()}원</p>
                <p className="text-[10px] text-gray-400">재고: {item.stock}개</p>
              </div>
              <button
                onClick={() => startNegotiation(item)}
                className="bg-orange-50 text-[#ff8a3d] px-3 py-2 rounded-xl font-bold text-xs hover:bg-[#ff8a3d] hover:text-white transition-all whitespace-nowrap"
              >
                사기
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SortChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${active ? 'bg-orange-500 border-orange-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{label}</button>
);

export default Buy;
