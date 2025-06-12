import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('유저 아이디를 입력하세요.');
      return;
    }
    localStorage.setItem('userId', userId.trim());
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2">
      <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-lg p-10">
        <h1 className="text-3xl font-bold mb-10 text-center text-blue-700">로그인</h1>
        <form className="space-y-8" onSubmit={handleLogin}>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-lg">유저 아이디</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full border rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="유저 아이디를 입력하세요"
            />
          </div>
          {error && <div className="text-red-500 text-base text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow hover:bg-blue-700 transition"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
} 