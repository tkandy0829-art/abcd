import { supabase } from './supabaseClient';
import { Item } from './types';

export const aiMarketService = {
    // 1. 마켓에 등록된 모든 상품 가져오기
    async getMarketItems() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // 2. AI가 자동으로 상품 등록 (시뮬레이션 루프에서 호출 가능)
    async registerAIItem(item: Omit<Item, 'id'>) {
        const { data, error } = await supabase
            .from('items')
            .insert([
                {
                    name: item.name,
                    category: item.category,
                    base_price: item.basePrice,
                    is_food: item.isFood,
                    image_url: item.image,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. 거래 완료 시 마켓에서 상품 삭제
    async removeMarketItem(itemId: string) {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    },

    // 4. (추가) AI가 너무 오래된 상품은 삭제하는 기능 등
    async cleanupOldItems() {
        // 24시간 이상 된 안 팔린 물건 삭제 로직 등
    }
};
