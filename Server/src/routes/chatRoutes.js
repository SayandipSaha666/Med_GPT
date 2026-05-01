// src/routes/chatRoutes.js
const express = require('express');
const {createChat, fetchChats, fetchChat, deleteChat, updateChatTitle} = require('../controllers/chatControllers');
const {sendMessage} = require('../controllers/messageController');
const router = express.Router();

// Auth middleware is applied at the router level in index.js
// so req.user is available in all these handlers

router.get('/create',    createChat)        // GET    — create a new chat
router.get('/all',        fetchChats)       // GET    — list all user chats
router.post('/:id/message', sendMessage)    // POST   — send message & get AI response
router.get('/:id',        fetchChat)        // GET    — fetch a single chat
router.delete('/:id',     deleteChat)          // DELETE — delete a chat
router.put('/update',  updateChatTitle)           // PUT    — update chat title

module.exports = router;