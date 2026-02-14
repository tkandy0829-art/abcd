
export enum NPCPersonality {
  KIND = '친절함',
  NORMAL = '보통',
  STRANGE = '이상함',
  RUDE = '욕설/무례'
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
  stock?: number;
  originalId?: string; // Original ID from items table
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
