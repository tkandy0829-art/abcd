
import Groq from "groq-sdk";
import { NPCPersonality, Item } from "./types";

// Vercel 환경변수 및 Vite 환경변수 대응 (VITE_ 접두어 사용 권장)
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

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

    if (!apiKey || apiKey === "undefined") {
        return {
            text: "상대방과 연결할 수 없습니다. (환경 변수에 VITE_GROQ_API_KEY가 설정되지 않았습니다.)",
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

    규칙:
    1. 성격에 맞춰 현실적인 한국어 구어체로 대화하고 명확한 가격을 제시하세요.
    2. 응답은 반드시 JSON 형식으로만 하세요: {"text": "대화내용", "newPrice": "숫자"}
    3. 협상 중 가격은 숫자로만 응답해야 합니다.
  `;

    const messages: any[] = [
        { role: "system", content: systemInstruction },
        ...chatHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        })),
        { role: "user", content: userMessage }
    ];

    try {
        const response = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(content);

        return {
            text: result.text || "음... 뭐라고 하셨나요?",
            newPrice: String(result.newPrice || currentPrice)
        };
    } catch (error: any) {
        if ((error?.status === 429 || error?.message?.includes('429')) && retryCount < MAX_RETRIES) {
            await delay(Math.pow(2, retryCount) * 1000);
            return getNPCResponse(mode, item, personality, userMessage, currentPrice, chatHistory, retryCount + 1);
        }

        console.error("Groq API Error:", error);
        return {
            text: "거래 상대방이 잠시 자리를 비운 것 같습니다. 잠시 후 다시 시도해주세요.",
            newPrice: String(currentPrice),
            isError: true
        };
    }
};
