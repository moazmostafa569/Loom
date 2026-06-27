import axios from "axios";

const baseurl = import.meta.env.VITE_BASE_URL

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

export async function changePassword(body) {
    const token = localStorage.getItem('user-token')
    if (!token) {
        throw new Error('Authentication token not found. Please log in again.')
    }

    let {data} = await axios.patch('https://route-posts.routemisr.com/users/change-password', body, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    })
    return data;
}
