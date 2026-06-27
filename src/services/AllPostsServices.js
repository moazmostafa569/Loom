import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "https://route-posts.routemisr.com";

function getAuthHeaders() {
    const token = localStorage.getItem('user-token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}



export async function getAllPosts() {
        const {data} = await axios.get(`${API_BASE_URL}/posts`, {
        headers: getAuthHeaders()
    })
        return data;
}
export async function getAllFollowingPosts() {
        const {data} = await axios.get(`${API_BASE_URL}/posts/feed?only=following&limit=10`, {
        headers: getAuthHeaders()
    })
        return data;
}

export async function createPost(formData) {
  const token = localStorage.getItem('user-token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const { data } = await axios.post(`${API_BASE_URL}/posts`, formData, {
    headers
  })
  return data
}
export async function savePost(postId) {
  if (!postId) {
    throw new Error('Missing postId for savePost');
  }

  // Backend expects a JSON body (not null) for bookmark requests.
  // Some implementations also require an explicit action field.
  const payload = { postId };

  const { data } = await axios.put(
    `${API_BASE_URL}/posts/${postId}/bookmark`,
    payload,
    { headers: getAuthHeaders() }
  );
  return data;
}

export async function getSavedPosts() {
  // axios.get accepts (url, config). Previously an empty object was passed
  // as the second arg which prevented headers from being sent.
  const { data } = await axios.get(`${API_BASE_URL}/users/bookmarks`, {
    headers: getAuthHeaders()
  })
  return data
}
export async function getFollowSuggestions() {
  const { data } = await axios.get(`${API_BASE_URL}/users/suggestions?limit=10`, {
    headers: getAuthHeaders()
  })
  return data
}
export async function putFollowOrUnfollow(userId) {
  const { data } = await axios.put(`${API_BASE_URL}/users/${userId}/follow`, {}, {
    headers: getAuthHeaders()
  })
  return data
}
export async function getPostLikes(postId) {
  const { data } = await axios.get(`${API_BASE_URL}/posts/${postId}/likes?page=1&limit=20`, {
    headers: getAuthHeaders()
  })
  return data
}


export async function getSinglePost(postId) {
        if (!postId) {
            throw new Error('Missing postId for getSinglePost');
        }
        let {data} = await axios.get(`${API_BASE_URL}/posts/${postId}`, {
            headers: getAuthHeaders()
        })
        return data;
}
export async function updatePost(postId, body) {
        if (!postId) {
            throw new Error('Missing postId for updatePost');
        }
        const payload = typeof body === 'string' ? { body } : body || {};
        let {data} = await axios.put(`${API_BASE_URL}/posts/${postId}`, payload, {
            headers: getAuthHeaders()
        })
        return data;
}
export async function deletePost(postId) {
        if (!postId) {
            throw new Error('Missing postId for deletePost');
        }
        let {data} = await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
            headers: getAuthHeaders()
        })
        return data;
}

export async function likePost(postId) {
        if (!postId) {
            throw new Error('Missing postId for likePost');
        }
        let {data} = await axios.put(`${API_BASE_URL}/posts/${postId}/like`, {}, {
            headers: getAuthHeaders()
        })
        return data;
}
export async function unlikePost(postId) {
        if (!postId) {
            throw new Error('Missing postId for unlikePost');
        }
        let {data} = await axios.delete(`${API_BASE_URL}/posts/${postId}/unlike`, {
            headers: getAuthHeaders()
        })
        return data;
}
export async function sharePost(postId) {
        if (!postId) {
            throw new Error('Missing postId for sharePost');
        }
        let {data} = await axios.post(`${API_BASE_URL}/posts/${postId}/share`, {}, {
            headers: getAuthHeaders()
        })
        return data;
}

export async function unSharePost(sharePostId) {
        if (!sharePostId) {
            throw new Error('Missing sharePostId for unSharePost');
        }
        let {data} = await axios.delete(`${API_BASE_URL}/posts/${sharePostId}`, {
            headers: getAuthHeaders()
        })
        return data;
}



