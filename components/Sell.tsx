
import React, { useState, useEffect, useRef } from 'react';
import { User, Item, NegotiationState, NPCPersonality, ChatMessage } from '../types';
import { getNPCResponse } from '../geminiService';

interface SellProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
  onNegotiationUpdate?: (item: Item | null, price: number) => void;
}

const Sell: React.FC<SellProps> = ({ user, onUpdateUser, onBack, onNegotiationUpdate }) => {
  const [negotiation, setNegotiation] = useState<NegotiationState | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [negotiation?.messages, isLoading]);

  useEffect(() => {
    if (onNegotiationUpdate) {
      onNegotiationUpdate(negotiation?.item || null, negotiation?.currentPriceOffer || 0);
    }
  }, [negotiation, onNegotiationUpdate]);

  const startSelling = (item: Item) => {
    const rand = Math.random();
    let personality = NPCPersonality.NORMAL;
    if (rand < 0.1) personality = NPCPersonality.RUDE; 
    else if (rand < 0.15) personality = NPCPersonality.SCAMMER;
    else if (rand < 0.25) personality = NPCPersonality.KIND_AI;

    const initialPrice = Math.floor(item.basePrice * (item.isCleaned ? 1.0 : 0.5));

    setNegotiation({
      active: true,
      item: item,
      npcPersonality: personality,
      currentPriceOffer: initialPrice, 
      messages: [{ 
        sender: 'npc', 
        text: `안녕하세요! 올려주신 '${item.name}' 보고 연락드렸습니다. 상태 좋아보이는데, 혹시 얼마 정도 생각하시나요?`, 
        timestamp: Date.now() 
      }],
      mode: 'sell'
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
      'sell',
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

  const completeTransaction = () => {
    if (!negotiation) return;
    
    const finalPrice = Number(negotiation.currentPriceOffer);
    const currentBalance = Number(user.balance);
    
    onUpdateUser({
      ...user,
      balance: currentBalance + finalPrice,
      inventory: user.inventory.filter(i => i.id !== negotiation.item.id)
    });
    alert(`판매 완료! ${finalPrice.toLocaleString()}원이 지급되었습니다.`);
    if (onNegotiationUpdate) onNegotiationUpdate(null, 0);
    onBack();
  };

  if (negotiation) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
          <div className="w-10"></div>
          <div className="text-center flex-1 mx-4">
            <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{negotiation.item.name}</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">당근 이웃(구매자)</p>
          </div>
          <button onClick={() => onBack()} className="text-red-500 font-medium text-sm">포기</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
          {negotiation.messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                m.sender === 'user' ? 'bg-[#ff8a3d] text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border px-4 py-2 rounded-2xl text-xs text-gray-400 animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span>이웃이 답변 중...</span>
              </div>
            </div>
          )}
          {hasError && (
            <div className="flex justify-center my-4">
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-[11px] font-bold border border-red-100 shadow-sm text-center">
                ⚠️ 서버가 바빠서 대답을 못하고 있어요 (Quota Exceeded).<br/>
                잠시 기다리거나, "홈으로"를 눌러 직전 가격으로 판매를 완료할 수 있습니다.
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-3 border-t flex flex-col gap-2 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center px-2 mb-1">
             <span className="text-xs text-gray-400 font-medium tracking-tight">현재 구매 제안가</span>
             <span className="text-sm font-black text-blue-600">{negotiation.currentPriceOffer.toLocaleString()}원</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              placeholder={isLoading ? "상대방의 입력을 기다리는 중..." : "얼마에 팔고 싶으신가요?"}
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
          <p className="text-[10px] text-gray-400 text-center mt-1">"네 알겠습니다"라고 입력하면 이 가격에 즉시 판매합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2 font-black">어떤 물건을 파시겠어요?</h2>
      
      {user.inventory.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
          <span className="text-5xl">📦</span>
          <p>팔 수 있는 물건이 없습니다.</p>
          <button onClick={() => onBack()} className="text-orange-500 font-bold mt-4 hover:underline">물건 사러 가기</button>
        </div>
      ) : (
        <div className="space-y-3">
          {user.inventory.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex gap-4 items-center active:scale-[0.98] transition-transform">
               <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-gray-50 flex-shrink-0" />
               <div className="flex-1 min-w-0">
                 <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                 <p className="text-[10px] text-gray-400">{item.isCleaned ? '✨ 세척됨' : '보통 상태'}</p>
                 <p className="text-xs text-orange-500 font-bold">예상 시세: {(item.basePrice * (item.isCleaned ? 2 : 1)).toLocaleString()}원</p>
               </div>
               <div className="flex flex-col gap-1">
                 <button 
                   onClick={() => startSelling(item)}
                   className="bg-[#ff8a3d] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#e67a2e] transition-colors shadow-sm"
                 >
                   판매
                 </button>
                 <button 
                   onClick={() => {
                     const halfPrice = Math.floor(item.basePrice / (item.isCleaned ? 1 : 2));
                     onUpdateUser({
                       ...user,
                       balance: user.balance + halfPrice,
                       inventory: user.inventory.filter(i => i.id !== item.id)
                     });
                     onBack();
                   }}
                   className="text-[10px] text-gray-400 hover:text-red-400 font-bold underline decoration-dotted"
                 >
                   즉시급처
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sell;
