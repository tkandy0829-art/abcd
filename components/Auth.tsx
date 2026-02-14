
import React, { useState } from 'react';
import { CarrotLogo } from '../constants';

interface AuthProps {
  onLogin: (id: string, pw: string) => void;
  onRegister: (id: string, pw: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9]+$/.test(id) || !/^[A-Za-z0-9]+$/.test(pw)) {
      alert('이름과 숨김 말은 서양 글자와 숫자만 쓸 수 있습니다.');
      return;
    }
    if (isLogin) {
      onLogin(id, pw);
    } else {
      onRegister(id, pw);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center">
        <CarrotLogo />
        <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">당근 보물 사고팔기 놀이</h1>
        <p className="text-gray-500 text-sm mb-8">{isLogin ? '문 열고 들어가세요' : '새 장터 사람이 되어보세요'}</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 ml-1 uppercase">이름 (ID)</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-[#ff8a3d] focus:ring-1 focus:ring-[#ff8a3d] outline-none transition-all"
              placeholder="서양글/숫자 이름"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 ml-1 uppercase">숨김 말 (Password)</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-[#ff8a3d] focus:ring-1 focus:ring-[#ff8a3d] outline-none transition-all"
              placeholder="서양글/숫자 숨김 말"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#ff8a3d] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#e67a2e] transition-all active:scale-95"
          >
            {isLogin ? '들어가기' : '이웃 되기'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-sm text-[#ff8a3d] font-medium hover:underline"
        >
          {isLogin ? '아직 이웃이 아니신가요? 이웃 되기' : '이미 이웃이신가요? 들어가기'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
