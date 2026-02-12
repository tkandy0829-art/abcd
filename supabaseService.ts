import { supabase } from './supabaseClient';
import { User, Item } from './types';

export const supabaseService = {
    // 1. 회원가입 및 유저 생성
    async createUser(user: User) {
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username: user.id,
                    password: user.password,
                    balance: user.balance,
                    is_admin: user.isAdmin,
                    is_banned: user.isBanned,
                    visit_history: user.visitHistory,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 2. 유저 정보 가져오기
    async getUser(username: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*, inventory(*)')
            .eq('username', username)
            .single();

        if (error) return null;
        return data;
    },

    // 3. 모든 유저 정보 (랭킹 및 어드민용)
    async getAllUsers() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('balance', { ascending: false });

        if (error) throw error;
        return data;
    },

    // 4. 유저 밸런스 및 인벤토리 업데이트
    async updateUserData(userId: string, balance: number, visitHistory: number[]) {
        const { error } = await supabase
            .from('users')
            .update({ balance, visit_history: visitHistory })
            .eq('id', userId);

        if (error) throw error;
    },

    // 5. 관리자용 유저 통합 업데이트 (벤, 관리자 권한 포함)
    async adminUpdateUser(userId: string, updates: any) {
        const { error } = await supabase
            .from('users')
            .update({
                password: updates.password,
                balance: updates.balance,
                is_banned: updates.isBanned,
                is_admin: updates.isAdmin,
                visit_history: updates.visitHistory
            })
            .eq('username', userId); // users table username is the id in our User object

        if (error) throw error;
    },

    // 6. 인벤토리 아이템 추가
    async addItemToInventory(userId: string, item: Item) {
        // 1. items 테이블에 아이템이 없으면 추가하는 로직이 필요할 수 있으나, 
        // 여기서는 간단하게 inventory에 메타데이터를 포함하거나 
        // 이미 존재하는 item_id를 사용한다고 가정합니다.
        // 스키마에 따라 items 테이블에 먼저 등록해야 할 수도 있습니다.
    }
};
