
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
      alert('아이디와 비밀번호는 서양 글자와 숫자만 쓸 수 있습니다.');
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
        <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">당근 중고거래 시뮬레이션</h1>
        <p className="text-gray-500 text-sm mb-8">{isLogin ? '계정에 로그인하세요' : '새로운 상인이 되어보세요'}</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 ml-1 uppercase">아이디 (에이아이디)</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-[#ff8a3d] focus:ring-1 focus:ring-[#ff8a3d] outline-none transition-all"
              placeholder="서양글자/숫자 아이디"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 ml-1 uppercase">비밀번호 (패스워드)</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-[#ff8a3d] focus:ring-1 focus:ring-[#ff8a3d] outline-none transition-all"
              placeholder="서양글자/숫자 비밀번호"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#ff8a3d] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#e67a2e] transition-all active:scale-95"
          >
            {isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-sm text-[#ff8a3d] font-medium hover:underline"
        >
          {isLogin ? '아직 계정이 없으신가요? 가입하기' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
