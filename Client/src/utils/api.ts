import { api } from '../api';

// API utilities
export async function callAuthUserApi() {
  const response = await api.get('/api/user/auth');
  return response.data;
}

export async function fetchChatsApi() {
  const response = await api.get('/api/chat/all');
  return response.data;
}

export async function fetchChatApi(chatId: string | number) {
  const response = await api.get(`/api/chat/${chatId}`);
  return response.data;
}

export async function createChatApi() {
  const response = await api.get('/api/chat/create');
  return response.data;
}

export async function deleteChatApi(chatId: string | number) {
  const response = await api.delete(`/api/chat/${chatId}`);
  return response.data;
}

export async function updateChatTitleApi(chatId: string | number, title: string) {
  const response = await api.put('/api/chat/update', { chatId, title });
  return response.data;
}

export async function sendMessageApi(chatId: string | number, content: string) {
  const response = await api.post(`/api/chat/${chatId}/message`, { content });
  return response.data;
}

export async function getPlansApi() {
  const response = await api.get('/api/billing/plans');
  return response.data;
}

export async function createOrderApi(planId: string) {
  const response = await api.post('/api/billing/create-order', { planId });
  return response.data;
}

export async function getPaymentStatusApi(orderId: string) {
  const response = await api.get('/api/billing/payment-status', { params: { orderId } });
  return response.data;
}

export async function updateProfileApi(name: string) {
  const response = await api.put('/api/user/profile', { name });
  return response.data;
}
