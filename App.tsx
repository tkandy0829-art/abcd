
import React, { useState, useEffect, useCallback } from 'react';
import { User, Item, NegotiationState, NPCPersonality } from './types';
import { INITIAL_BALANCE, ROT_TIME_MS } from './constants';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Home from './components/Home';
import Buy from './components/Buy';
import Sell from './components/Sell';
import Inventory from './components/Inventory';
import Admin from './components/Admin';
import Ranking from './components/Ranking';
import { supabaseService } from './supabaseService';
import { aiMarketService } from './aiMarketService';
import { CATEGORIES, ADJECTIVES, NOUNS } from './components/Buy';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'buy' | 'sell' | 'inventory' | 'admin' | 'ranking'>('home');
  const [activeNegotiation, setActiveNegotiation] = useState<{ item: Item, price: number, mode: 'buy' | 'sell' } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial data fetch from Supabase
  useEffect(() => {
    const initData = async () => {
      try {
        const dbUsers = await supabaseService.getAllUsers();
        if (dbUsers) setUsers(dbUsers.map((u: any) => ({
          id: u.username,
          password: u.password,
          balance: u.balance,
          inventory: u.inventory || [],
          visitHistory: u.visit_history || [],
          isAdmin: u.is_admin,
          isBanned: u.is_banned
        })));

        // Session Persistence: Check localStorage
        const savedUserId = localStorage.getItem('carrot_user_id');
        if (savedUserId) {
          const dbUser = await supabaseService.getUser(savedUserId);
          if (dbUser) {
            setUser({
              id: dbUser.username,
              password: dbUser.password,
              balance: dbUser.balance,
              inventory: dbUser.inventory || [],
              visitHistory: dbUser.visit_history || [],
              isAdmin: dbUser.is_admin,
              isBanned: dbUser.is_banned
            });
          }
        }

        await aiMarketService.checkAndReplenish();
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // AI Auto-Posting Loop
  useEffect(() => {
    if (!user) return;

    const aiPostInterval = setInterval(async () => {
      // 30% chance to post a new item every 30 seconds
      if (Math.random() < 0.3) {
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const isFood = category === '식품' || noun.match(/과자|사료|빵|조각|귤|복숭아|소고기|수박|포도/);
        const basePrice = isFood ? (Math.floor(Math.random() * 30) + 1) * 500 : (Math.floor(Math.random() * 200) + 1) * 5000;

        try {
          await aiMarketService.registerAIItem({
            name: `${adj} ${noun} (판매 중)`,
            category,
            basePrice,
            isFood: !!isFood,
            isCleaned: true,
            image: `https://picsum.photos/seed/${Date.now()}/200/200`
          }, isFood ? 100 : 900);
          console.log("새로운 판매 물건이 올라왔습니다!");
        } catch (err) {
          console.error("AI post failed", err);
        }
      }
    }, 30000);

    return () => clearInterval(aiPostInterval);
  }, [user]);

  // Update current user in sync with users list
  useEffect(() => {
    if (user) {
      const updatedUser = users.find((u: User) => u.id === user.id);
      if (updatedUser) {
        if (updatedUser.isBanned && !updatedUser.isAdmin) {
          alert('당신의 계정은 관리자에 의해 정지되었습니다.');
          setUser(null);
          setView('home');
        } else {
          setUser({
            ...updatedUser,
            isAdmin: (updatedUser.id === 'ltk2757' || updatedUser.id === 'master') ? true : updatedUser.isAdmin
          });
        }
      }
    }
  }, [users]);

  const handleLogin = async (id: string, pw: string) => {
    try {
      const dbUser = await supabaseService.getUser(id);
      await supabaseService.logEvent(id, 'LOGIN_ATTEMPT', `User ${id} tried to log in.`);

      // Admin Management for ltk2757 & master
      if (id === 'ltk2757' || id === 'master') {
        if (dbUser && !dbUser.is_admin) {
          // Force elevation if db exists but not admin
          await supabaseService.adminUpdateUser(id, { isAdmin: true });
        }
      }

      if (dbUser && dbUser.password === pw) {
        if (dbUser.is_banned && !dbUser.is_admin) {
          alert('활동이 정지된 계정입니다. 접속할 수 없습니다.');
          await supabaseService.logEvent(id, 'LOGIN_BANNED', `Banned user ${id} attempted login.`);
          return;
        }
        const updatedHistory = [...(dbUser.visit_history || []), Date.now()];
        await supabaseService.updateUserData(dbUser.id, dbUser.balance, updatedHistory, dbUser.inventory || []);

        const loggedInUser: User = {
          id: dbUser.username,
          password: dbUser.password,
          balance: dbUser.balance,
          inventory: dbUser.inventory || [],
          visitHistory: updatedHistory,
          isAdmin: (id === 'ltk2757' || id === 'master') ? true : dbUser.is_admin,
          isBanned: dbUser.is_banned
        };
        setUser(loggedInUser);
        localStorage.setItem('carrot_user_id', id); // Save to session
        await supabaseService.logEvent(id, 'LOGIN_SUCCESS', `${id} 님이 로그인했습니다.`);
      } else {
        alert('아이디 또는 비밀번호가 틀렸습니다.');
        await supabaseService.logEvent(id, 'LOGIN_FAILURE', `User ${id} failed login (wrong credentials).`);
      }
    } catch (err) {
      console.error("Login Error Details:", err);
      alert('로그인 중에 오류가 발생했습니다.');
      await supabaseService.logEvent(id, 'LOGIN_ERROR', `로그인 중 오류 발생 ${id}: ${JSON.stringify(err)}`);
    }
  };

  const handleRegister = async (id: string, pw: string) => {
    try {
      console.log(`Starting registration for ${id}...`);
      const existing = await supabaseService.getUser(id);
      if (existing) {
        alert('이미 존재하는 아이디입니다.');
        return;
      }
      const newUser: User = {
        id,
        password: pw,
        balance: INITIAL_BALANCE,
        inventory: [],
        visitHistory: [Date.now()],
        isAdmin: id === 'ltk2757',
        isBanned: false
      };
      await supabaseService.createUser(newUser);
      setUser(newUser);
      alert('회원가입 완료!');
    } catch (err: any) {
      console.error("Registration Error Details:", err);
      alert(`회원가입 중에 오류가 발생했습니다: ${err.message || JSON.stringify(err)}`);
    }
  };

  const updateUser = useCallback(async (updatedUser: User) => {
    setUsers((prev: User[]) => prev.map((u: User) => u.id === updatedUser.id ? updatedUser : u));
    try {
      // Sync to Supabase
      const dbUser = await supabaseService.getUser(updatedUser.id);
      if (dbUser) {
        await supabaseService.updateUserData(dbUser.id, updatedUser.balance, updatedUser.visitHistory, updatedUser.inventory);
        // If ban/admin status changed, special handling or update other fields
        // For simplicity, we assume updateUserData covers basic stats
      }
    } catch (err) {
      console.error("Supabase sync failed", err);
    }
  }, []);

  const handleAdminUpdateUsers = async (updatedUsers: User[]) => {
    // Determine which user was updated by comparing with current state
    const changedUser = updatedUsers.find((u: User, i: number) => {
      const current = users[i];
      return current && (
        u.balance !== current.balance ||
        u.isBanned !== current.isBanned ||
        u.isAdmin !== current.isAdmin
      );
    });

    setUsers(updatedUsers);

    if (changedUser) {
      try {
        await supabaseService.adminUpdateUser(changedUser.id, changedUser);
        console.log(`Admin sync complete for ${changedUser.id}`);
      } catch (err) {
        console.error("Admin sync failed", err);
        alert("데이터베이스 동기화에 실패했습니다. (Admin Sync Error)");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('carrot_user_id'); // Clear session
    setUser(null);
    setView('home');
    setActiveNegotiation(null);
  };

  const handleHomeNavigation = () => {
    // 협상 중인 물건이 있으면 직전 가격으로 자동 거래 완료
    if (activeNegotiation && user) {
      const finalPrice = Number(activeNegotiation.price);
      const currentBalance = Number(user.balance);

      if (activeNegotiation.mode === 'buy') {
        // 구매 협상 중 이탈 시 자동 구매 (잔액 부족 시 취소)
        if (currentBalance >= finalPrice) {
          // 재고 차감
          aiMarketService.updateStock(activeNegotiation.item.id, -1);

          const newItem: Item = {
            ...activeNegotiation.item,
            id: `owned-${Date.now()}`,
            originalId: activeNegotiation.item.id,
            purchaseTime: activeNegotiation.item.isFood ? Date.now() : undefined,
          };
          updateUser({
            ...user,
            balance: currentBalance - finalPrice,
            inventory: [...user.inventory, newItem]
          });
        }
      } else if (activeNegotiation.mode === 'sell') {
        // 판매 협상 중 이탈 시 자동 판매
        // 재고 가산
        if (activeNegotiation.item.originalId) {
          aiMarketService.updateStock(activeNegotiation.item.originalId, 1);
        }

        updateUser({
          ...user,
          balance: currentBalance + finalPrice,
          inventory: user.inventory.filter((i: Item) => i.id !== activeNegotiation.item.id)
        });
      }
    }

    setActiveNegotiation(null);
    setView('home');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <Layout
      user={user}
      onHome={handleHomeNavigation}
      onLogout={logout}
      isAdmin={user.isAdmin}
      onAdmin={() => setView('admin')}
    >
      {view === 'home' && (
        <Home
          user={user}
          onNavigate={(v: string) => setView(v as any)}
        />
      )}
      {view === 'buy' && (
        <Buy
          user={user}
          onUpdateUser={updateUser}
          onBack={handleHomeNavigation}
          onNegotiationUpdate={(item: Item | null, price: number) => setActiveNegotiation(item ? { item, price, mode: 'buy' } : null)}
        />
      )}
      {view === 'sell' && (
        <Sell
          user={user}
          onUpdateUser={updateUser}
          onBack={handleHomeNavigation}
          onNegotiationUpdate={(item: Item | null, price: number) => setActiveNegotiation(item ? { item, price, mode: 'sell' } : null)}
        />
      )}
      {view === 'inventory' && (
        <Inventory
          user={user}
          onUpdateUser={updateUser}
          onBack={handleHomeNavigation}
        />
      )}
      {view === 'admin' && (
        <Admin
          users={users}
          onUpdateUsers={handleAdminUpdateUsers}
          onBack={handleHomeNavigation}
        />
      )}
      {view === 'ranking' && (
        <Ranking
          users={users}
          onBack={handleHomeNavigation}
        />
      )}
    </Layout>
  );
};

export default App;
