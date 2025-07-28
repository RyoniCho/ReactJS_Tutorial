import React, { useState } from 'react';
import axios from 'axios';
import Config from './Config';

const AdminPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guest');
  const [message, setMessage] = useState('');

  const handleAddUser = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('accessToken');
    try {
      const res = await axios.post(
        `${Config.apiUrl}/api/users`,
        { username, password, role },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setMessage('유저 등록 성공!');
      setUsername('');
      setPassword('');
      setRole('guest');
    } catch (err) {
      setMessage('유저 등록 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h2>관리자 페이지</h2>
      <form onSubmit={handleAddUser} style={{marginBottom: '2rem'}}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="아이디" required />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="비밀번호" required />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="guest">guest</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit">유저 추가</button>
      </form>
      {message && <p>{message}</p>}
      {/* 추후 영화별 재생 통계 등 추가 가능 */}
    </div>
  );
};

export default AdminPage;
