
export enum NPCPersonality {
  NORMAL = '일반',
  SCAMMER = '사기꾼',
  KIND_AI = '친절한 AI',
  RUDE = '진상/욕설'
}

export interface Item {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  isFood: boolean;
  purchaseTime?: number;
  isCleaned: boolean;
  image: string;
}

export interface User {
  id: string;
  password: string;
  balance: number;
  inventory: Item[];
  visitHistory: number[];
  isAdmin: boolean;
  isBanned: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'npc';
  text: string;
  timestamp: number;
}

export interface NegotiationState {
  active: boolean;
  item: Item;
  npcPersonality: NPCPersonality;
  currentPriceOffer: number;
  messages: ChatMessage[];
  mode: 'buy' | 'sell';
}
