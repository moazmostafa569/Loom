import apiClient from './apiClient';

export async function registerUser(body) {
    const { data } = await apiClient.post('/users/signup', body);
    return data;
}
export async function loginUser(body) {
    const { data } = await apiClient.post('/users/signin', body);
    return data;
}

export async function changePassword({ password, newPassword }) {
  const token = localStorage.getItem('user-token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  const payload = { password, newPassword };

  try {
    const { data } = await apiClient.patch('/users/change-password', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('[changePassword] response:', data);
    return data;
  } catch (error) {
    console.error('[changePassword] error:', error.response?.data ?? error.message);
    throw error;
  }
}