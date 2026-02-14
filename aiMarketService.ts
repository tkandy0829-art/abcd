import { supabase } from './supabaseClient';
import { Item } from './types';

export const aiMarketService = {
    // 1. 마켓에 등록된 모든 상품 가져오기 (재고가 있는 것만)
    async getMarketItems() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .gt('stock', 0) // 재고가 0보다 큰 것만 가져옴
            .order('created_at', { ascending: false });

        if (error) throw error;
        // Transform DB data to frontend Item type
        return (data || []).map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            basePrice: item.base_price,
            isFood: item.is_food,
            image: item.image_url,
            stock: item.stock
        }));
    },

    // 2. AI가 자동으로 상품 등록
    async registerAIItem(item: Omit<Item, 'id'>, stock: number = 1) {
        const { data, error } = await supabase
            .from('items')
            .insert([
                {
                    name: item.name,
                    category: item.category,
                    base_price: item.basePrice,
                    is_food: item.isFood,
                    image_url: item.image,
                    stock: stock
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. 재고 업데이트 (구매 시 -1, 판매 시 +1)
    async updateStock(itemId: string, delta: number) {
        // 기존 재고 확인
        const { data: item, error: fetchError } = await supabase
            .from('items')
            .select('stock')
            .eq('id', itemId)
            .single();

        if (fetchError) throw fetchError;

        const newStock = Math.max(0, (item.stock || 0) + delta);

        const { error: updateError } = await supabase
            .from('items')
            .update({ stock: newStock })
            .eq('id', itemId);

        if (updateError) throw updateError;
    },

    // 4. 5시간마다 아이템 보충 확인
    async checkAndReplenish() {
        const { data: state, error: stateError } = await supabase
            .from('market_state')
            .select('*')
            .eq('id', 'global')
            .single();

        if (stateError) return;

        const lastTime = new Date(state.last_replenishment_time).getTime();
        const now = Date.now();
        const fiveHours = 5 * 60 * 60 * 1000;

        if (now - lastTime >= fiveHours) {
            console.log("Replenishing market items...");

            // 5개의 새로운 아이템 추가
            const dummyPool = [
                { name: '닌텐도 스위치 OLED', category: '전자기기', basePrice: 400000, isFood: false, image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e', isCleaned: true },
                { name: '스타벅스 텀블러', category: '생활용품', basePrice: 35000, isFood: false, image: 'https://images.unsplash.com/photo-1517254456976-ee8682099819', isCleaned: true },
                { name: '프리미엄 소고기 세트', category: '식품', basePrice: 120000, isFood: true, image: 'https://images.unsplash.com/photo-1544022613-e879a7998d2f', isCleaned: true },
                { name: '허먼밀러 에어론 체어', category: '가구', basePrice: 1800000, isFood: false, image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8', isCleaned: true },
                { name: '구찌 마틀라세 숄더백', category: '명품', basePrice: 2800000, isFood: false, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3', isCleaned: true },
                { name: '신전 떡볶이 기프티콘', category: '식품', basePrice: 15000, isFood: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246', isCleaned: true }
            ];

            // 랜덤하게 5개 선택
            const selected = dummyPool.sort(() => 0.5 - Math.random()).slice(0, 5);

            for (const item of selected) {
                const initialStock = item.isFood ? 100 : 900;
                await this.registerAIItem(item, initialStock);
            }

            // 시간 업데이트
            await supabase
                .from('market_state')
                .update({ last_replenishment_time: new Date().toISOString() })
                .eq('id', 'global');
        }
    }
};
