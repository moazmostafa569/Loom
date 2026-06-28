import axios from "axios";

export async function registerUser(body) {
    let {data} = await axios.post('https://route-posts.routemisr.com/users/signup', body, {
        headers:{
            'Content-Type': 'application/json'
        }
    })
    return data;
}
export async function loginUser(body) {
    let {data} = await axios.post('https://route-posts.routemisr.com/users/signin', body, {
        headers:{
            'Content-Type': 'application/json'
        }
    })
    return data;
}

export async function changePassword({ password, newPassword }) {
  const token = localStorage.getItem('user-token');
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  const payload = { password, newPassword };

  try {
    const { data } = await axios.patch(
      'https://route-posts.routemisr.com/users/change-password',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('[changePassword] response:', data);
    return data;
  } catch (error) {
    console.error('[changePassword] error:', error.response?.data ?? error.message);
    throw error;
  }
}