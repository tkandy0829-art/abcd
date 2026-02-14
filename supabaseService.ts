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
        // ... 생략
    },

    // 7. 사용자 추적 로그 기록
    async logEvent(username: string | null, eventType: string, description: string) {
        try {
            await supabase
                .from('user_logs')
                .insert([{
                    user_id: username,
                    event_type: eventType,
                    description: description
                }]);
        } catch (err) {
            console.error("Log failed:", err);
        }
    }
};

// supabaseService 래퍼 - 로그 기록을 위해 일부 메서드 수정
const originalCreateUser = supabaseService.createUser;
supabaseService.createUser = async function (user: User) {
    const data = await originalCreateUser(user);
    await supabaseService.logEvent(user.id, 'SIGNUP', `User ${user.id} registered.`);
    return data;
};

const originalUpdateUserData = supabaseService.updateUserData;
supabaseService.updateUserData = async function (userId: string, balance: number, visitHistory: number[]) {
    await originalUpdateUserData(userId, balance, visitHistory);
    // userId is UUID here, we might want to log with username but let's just log the event
    await supabaseService.logEvent(null, 'UPDATE_DATA', `User UUID ${userId} balance updated to ${balance}.`);
};
