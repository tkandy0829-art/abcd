
import { GoogleGenAI } from "@google/genai";
import { NPCPersonality, Item } from "./types";

// 가이드라인에 따라 process.env.API_KEY를 사용하여 초기화합니다.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getNPCResponse = async (
  mode: 'buy' | 'sell',
  item: Item,
  personality: NPCPersonality,
  userMessage: string,
  currentPrice: number,
  chatHistory: { sender: 'user' | 'npc'; text: string }[],
  retryCount = 0
): Promise<{ text: string; newPrice: string; isError?: boolean }> => {
  // API 키가 할당되지 않았을 경우 (대시보드 설정을 안 했거나 주입되지 않았을 때)
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    return {
      text: "상대방과 연결할 수 없습니다. (환경 변수에 API_KEY가 설정되지 않았습니다.)",
      newPrice: String(currentPrice),
      isError: true
    };
  }

  const MAX_RETRIES = 3;
  const isRotten = item.isFood && item.purchaseTime && (Date.now() - item.purchaseTime > 1800000);
  
  const systemInstruction = `
    당신은 중고 거래 시뮬레이션 게임의 NPC입니다.
    현재 거래 모드: ${mode === 'buy' ? '판매자' : '구매자'}
    물건: ${item.name} (기본 시세: ${item.basePrice}원)
    물건 상태: ${item.isCleaned ? '세척됨' : '보통'}, ${isRotten ? '부패함' : '싱싱함'}
    당신의 성격: ${personality}
    현재 제안 가격: ${currentPrice}원

    규칙: 성격에 맞춰 현실적인 한국어 구어체로 대화하고 명확한 가격을 제시하세요.
    응답은 반드시 JSON 형식으로만 하세요: {"text": "대화내용", "newPrice": "숫자"}
  `;

  const historyPrompt = chatHistory.map(m => `${m.sender === 'user' ? '플레이어' : 'NPC'}: ${m.text}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${historyPrompt}\n플레이어: ${userMessage}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      text: result.text || "음... 뭐라고 하셨나요?",
      newPrice: String(result.newPrice || currentPrice)
    };
  } catch (error: any) {
    // 429(할당량 초과) 에러 시 재시도 로직
    if ((error?.status === 429 || error?.message?.includes('429')) && retryCount < MAX_RETRIES) {
      await delay(Math.pow(2, retryCount) * 1000);
      return getNPCResponse(mode, item, personality, userMessage, currentPrice, chatHistory, retryCount + 1);
    }
    
    console.error("Gemini API Error:", error);
    return { 
      text: "거래 상대방이 잠시 자리를 비운 것 같습니다. 잠시 후 다시 시도해주세요.", 
      newPrice: String(currentPrice), 
      isError: true 
    };
  }
};
