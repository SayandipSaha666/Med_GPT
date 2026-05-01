import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const callRegisterUserApi = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/user/register`, data, {
        withCredentials: true,
    });
    return response?.data;
}

export const callLoginUserApi = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/user/login`, data, {
        withCredentials: true,
    });
    return response?.data;
}

export const callLogoutUserApi = async () => {
    const response = await axios.post(`${API_BASE_URL}/api/user/logout`, {}, {
        withCredentials: true,
    });
    return response?.data;
}

export const callAuthUserApi = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/user/auth`, {
        withCredentials: true,
    });
    return response?.data;
}

export const createChatApi = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/chat/create`,{
        withCredentials: true,
    })
    return response?.data;
}

export const fetchChatsApi = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/chat/all`,{
        withCredentials: true,
    })
    return response?.data;
}

export const fetchChatApi = async (chatId) => {
    const response = await axios.get(`${API_BASE_URL}/api/chat/${chatId}`,{
        withCredentials: true,
    })
    return response?.data;
}

export const deleteChatApi = async (chatId) => {
    const response = await axios.delete(`${API_BASE_URL}/api/chat/${chatId}`,{
        withCredentials: true,
    })
    return response?.data;
}

export const updateChatTitleApi = async (chatId, title) => {
    const response = await axios.put(`${API_BASE_URL}/api/chat/update`,{chatId, title},{
        withCredentials: true,
    })
    return response?.data;
}

export const sendMessageApi = async (chatId, content) => {
    const response = await axios.post(`${API_BASE_URL}/api/chat/${chatId}/message`,{content},{
        withCredentials: true,
    })
    return response?.data;
}

export const getPlansApi = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/billing/plans`,{
        withCredentials: true,
    })
    return response?.data;
}

export const createOrderApi = async (planId) => {
    const response = await axios.post(`${API_BASE_URL}/api/billing/create-order`,{planId},{
        withCredentials: true,
    })
    return response?.data;
}

export const getPaymentStatusApi = async (orderId) => {
    const response = await axios.get(`${API_BASE_URL}/api/billing/payment-status`,{
        withCredentials: true,
        params: { orderId }
    })
    return response?.data;
}

export const updateProfileApi = async (name) => {
    const response = await axios.put(`${API_BASE_URL}/api/user/profile`, { name }, {
        withCredentials: true,
    })
    return response?.data;
}