import React, { useEffect,useState } from 'react';
import axios from 'axios';
import Config from './Config';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guest');
  const [message, setMessage] = useState('');
  const [actionLogs, setActionLogs] = useState([]);
  const [watchHistories, setWatchHistories] = useState([]);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    // 유저 액션 로그 조회
    axios.get(`${Config.apiUrl}/api/admin/user-action-logs`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => setActionLogs(res.data)).catch(() => setActionLogs([]));
    // 시청 기록 조회
    axios.get(`${Config.apiUrl}/api/admin/watch-histories`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => setWatchHistories(res.data)).catch(() => setWatchHistories([]));
  }, []);

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
      
      <h3>로그인/조회/재생 로그</h3>
      <table border="1" cellPadding="4" style={{marginBottom: '2rem', width: '100%'}}>
        <thead>
          <tr>
            <th>유저</th>
            <th>액션</th>
            <th>상세</th>
            <th>시간</th>
          </tr>
        </thead>
        <tbody>
          {actionLogs.map(log => (
            <tr key={log._id}>
              <td>{log.userId?.username || '-'}</td>
              <td>{log.action}</td>
              <td>
                {log.targetId ? 
                <Link to={`/movies/${log.targetId}`}>{log.details}</Link> : (log.details)}
              </td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

       <h3>영화별 재생 위치 기록</h3>
      <table border="1" cellPadding="4" style={{width: '100%'}}>
        <thead>
          <tr>
            <th>유저</th>
            <th>영화</th>
            <th>시청 위치(초)</th>
            <th>업데이트 시간</th>
          </tr>
        </thead>
        <tbody>
          {watchHistories.map(h => (
            <tr key={h._id}>
              <td>{h.userId?.username || '-'}</td>
              <td>{h.movieId?.title || h.movieId?.serialNumber || '-'}</td>
              <td>{h.lastWatchedTime}</td>
              <td>{new Date(h.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
