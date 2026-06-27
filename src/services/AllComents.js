import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "https://route-posts.routemisr.com";

function getAuthHeaders(isJson = true) {
    const token = localStorage.getItem('user-token')
    return {
        ...(isJson ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}

export async function getAllComments(postId) {
    let { data } = await axios.get(`${API_BASE_URL}/posts/${postId}/comments?page=1&limit=10`, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function createComment(postId, commentData) {
    const isFormData = commentData instanceof FormData;
    let { data } = await axios.post(`${API_BASE_URL}/posts/${postId}/comments?`, commentData, {
        headers: getAuthHeaders(!isFormData)
    })
    return data;
}

export async function getReplies(postId, commentId) {
    let { data } = await axios.get(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/replies?page=1&limit=10`, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function createReply(postId, commentId, replyData) {
    let { data } = await axios.post(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/replies?page=1&limit=10`, replyData, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function UpdateComment(postId, commentId, replyData) {
    let { data } = await axios.put(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, replyData, {
        headers: getAuthHeaders()
    })
    return data;
}

export async function deleteComment(postId, commentId) {
    let { data } = await axios.delete(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function ReactComment(postId, commentId) {
    let { data } = await axios.put(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/like`, {}, {
        headers: getAuthHeaders()
    });
    return data;
}
