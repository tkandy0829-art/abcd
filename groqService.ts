
import Groq from "groq-sdk";
import { NPCPersonality, Item } from "./types";

// Vercel 환경변수 및 Vite 환경변수 대응
const getApiKey = () => import.meta.env.VITE_GROQ_API_KEY;

// 클라이언트를 함수 내부에서 초기화하거나, 더미 키를 제공하여 즉시 에러가 나지 않도록 합니다.
const createGroqClient = () => {
    const key = getApiKey();
    return new Groq({
        apiKey: key || "MISSING_API_KEY",
        dangerouslyAllowBrowser: true
    });
};

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
    const apiKey = getApiKey();

    if (!apiKey || apiKey === "undefined" || apiKey === "") {
        return {
            text: "상대방과 연결할 수 없습니다. (Vercel 환경 변수에 VITE_GROQ_API_KEY를 등록해주세요.)",
            newPrice: String(currentPrice),
            isError: true
        };
    }

    const groq = createGroqClient();

    const MAX_RETRIES = 3;
    const isRotten = item.isFood && item.purchaseTime && (Date.now() - item.purchaseTime > 1800000);

    const personalityDetails = {
        [NPCPersonality.KIND]: "매우 상냥하고 배려심이 깊습니다. 가격 제안을 기분 좋게 수락하는 편이며, 물건을 살 때는 오히려 더 얹어주기도 합니다. 말투에 '^^', 'ㅎㅎ', '감사합니다'가 많습니다.",
        [NPCPersonality.NORMAL]: "평범한 당근마켓 거래자입니다. 예의 바르지만 손해는 보지 않으려 하며, 합리적인 수준의 네고(협상)만 받아들입니다.",
        [NPCPersonality.STRANGE]: "종잡을 수 없는 사람입니다. 갑자기 엉뚱한 소리를 하거나, 가격을 말도 안 되게 부르기도 합니다. 말투가 독특하고 예측이 불가능합니다.",
        [NPCPersonality.RUDE]: "매우 무례하고 예의가 없습니다. 가격 깎는 것을 극도로 싫어하며, 유저가 무리하게 네고를 요청하면 화를 내며 오히려 가격을 인상하거나 거래를 거부합니다. 말투가 거칠고 공격적입니다."
    }[personality];

    const systemInstruction = `
    당신의 역할: 중고 거래 어플(당근마켓 등)의 실제 이용자 NPC
    현재 당신의 상태:
    - 거래 모드: ${mode === 'buy' ? '판매자 (유저가 구매 시도 중)' : '구매자 (유저가 판매 시도 중)'}
    - 대상 물건: ${item.name} (기본 시세: ${item.basePrice}원)
    - 물건 상태: ${item.isCleaned ? '세척됨' : '보통'}, ${isRotten ? '부패함/썩음' : '싱싱함'}
    - 당신의 성격: ${personality} (${personalityDetails})
    - 현재 합의된 가격: ${currentPrice}원

    대화 규칙 (가장 중요):
    1. **사람처럼 길게 하세요**: 대답을 할 때는 적어도 세 문장 넘게 길게 써 주세요. 상황을 자세히 설명하거나 감정을 풍부하게 담아 실제 사람과 말하는 것처럼 느껴지게 하세요.
    2. **말투 및 표현**:
        - 당신은 중고 거래 장터의 활기찬 이웃입니다. 말투는 부드럽고 생동감이 있어야 합니다.
        - 한국어(표준어)를 사용하되, 영문 글자(iPad, iPhone, Coffee 등)은 절대 사용하지 말고 소리나는 대로 한글로 적으세요 (아이패드, 아이폰, 커피).
        - 일본어 찌꺼기나 일본식 표현은 절대 쓰지 마세요.
        - 대화는 풍성하고 길게 하세요. 물건의 상태를 묻거나, 아쉬움을 표현하거나, 정겨운 이야기를 덧붙이세요.
        - '네고', '직거래', '로그인' 등 일상적인 한국어 단어는 사용해도 좋으나 영문 표기는 금지합니다.
    3. **성격 반영**:
       - '친절함': 값을 유저에게 좋게 잘 맞춰줍니다.
       - '보통': 적당히 팽팽하게 밀당합니다.
       - '이상함': 엉뚱한 소리를 늘어놓거나 갑자기 값을 크게 바꾸기도 합니다.
       - '욕설/무례': **절대 값을 깎아주지 않습니다.** 유저가 자꾸 깎아달라고 하면 "정말 짜증나게 하네", "살 생각 없으면 가세요" 라며 오히려 값을 ${currentPrice}원에서 **높여서** 골탕 먹이세요.
    4. **나가는 형식**: 반드시 JSON 형식으로만 응답하세요: {"text": "상대방에게 할 우리말", "newPrice": "고쳐진(또는 그대로인) 값 숫자"}
    5. **값**: 맞춘 마지막 값을 'newPrice' 칸에 숫자로만 적으세요.
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
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
