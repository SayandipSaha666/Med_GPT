// src/routes/chatRoutes.js
const express = require('express');
const {createChat, fetchChats, fetchChat, deleteChat, updateChatTitle} = require('../controllers/chatControllers');
const {sendMessage} = require('../controllers/messageController');
const router = express.Router();

// You can add routes here later
router.post('/create',createChat)
router.post('/all',fetchChats)
router.post('/:id/message', sendMessage)   // Send message & get AI response
router.post('/:id',fetchChat)
router.delete('/:id',deleteChat)
router.put('/:id/title',updateChatTitle)

module.exports = router;

