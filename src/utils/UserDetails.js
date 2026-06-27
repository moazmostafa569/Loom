
import { putFollowOrUnfollow } from "../services/AllPostsServices";
import { loginUser } from "../services/authServices";

export let userId = typeof window !== 'undefined' ? localStorage.getItem('user-id') : null;

function getUserIdFromToken() {
  try {
    const token = localStorage.getItem('user-token');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.id || payload?._id || payload?.userId || payload?.sub || null;
  } catch {
    return null;
  }
}

export function getStoredUserId() {
  if (typeof window === 'undefined') return userId;

  const stored = localStorage.getItem('user-id');
  if (stored) {
    userId = stored;
    return stored;
  }

  const fromToken = getUserIdFromToken();
  if (fromToken) {
    setStoredUserId(fromToken);
    return fromToken;
  }

  return userId;
}

export function setStoredUserId(id) {
  userId = id;
  if (typeof window !== 'undefined' && id) {
    localStorage.setItem('user-id', id);
  }
}

export async function getUserId(data) {
  try {
    const response = await loginUser(data);
    const id = response?.data?.user?._id || response?.data?.user?.id || null;

    if (id) {
      setStoredUserId(id);
    }

    return id;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
  }
}
    
export async function handleFollowingUsers(userId) {
  if (!userId) {
    console.error('User ID is required to follow a user');
    return;
  }
  try {
    let {data} = await putFollowOrUnfollow(userId)
    
    console.log(data);
  } catch (error) {
    console.log(error);
  }
    
}