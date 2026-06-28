import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "https://route-posts.routemisr.com";

function getAuthHeaders() {
    const token = localStorage.getItem('user-token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}

export async function getProfile() {
    const { data } = await axios.get(`${API_BASE_URL}/users/profile-data`, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function getUserPosts(userId) {
    const { data } = await axios.get(`${API_BASE_URL}/users/${userId}/posts`, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function getUserProfile(userId) {
    const { data } = await axios.get(`${API_BASE_URL}/users/${userId}/profile`, {
        headers: getAuthHeaders()
    })
    return data;
}
export async function uploadProfilePicture(formData) {
    if (!formData) {
        throw new Error('Missing form data for upload');
    }

    const token = localStorage.getItem('user-token');

    const { data } = await axios.put(`${API_BASE_URL}/users/upload-photo`, formData, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    return data;
}


