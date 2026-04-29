const { prisma } = require('../lib/prisma');
const joi = require('joi');

const createChatSchema = joi.object({
    title: joi.string().required()
})

const createChat = async (req,res,next) => {
    const userId = req.user.id;
    const {title} = req.body;
    const content = {
        userId: userId,
        title: title
    }
    const {error} = createChatSchema.validate({title});
    if(error){
        console.log(error)
        return res.status(422).json({success: false, message: "Insufficient data!"})
    }
    try {
        const chat = await prisma.chat.create({
            data: content
        })
        if(!chat) return res.status(400).json({success: false, message: "Error creating chat!"})
        return res.status(201).json({
            success: true,
            message: 'Chat created successfully!',
            chat
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Error creating chat!'})
    }
}

const fetchChats = async (req,res,next) => {
    const userId = req.user.id;
    try {
        const chats = await prisma.chat.findMany({
            where: {
                userId: userId
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: {
                        timestamp: 'desc'
                    }
                }
            }
        })
        if(chats.length===0) return res.status(404).json({success: false, message: "No chats found!"})
        return res.status(200).json({
            success: true,
            message: 'Chats fetched successfully!',
            chats
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Error fetching chats!'})
    }
}

const fetchChat = async (req,res,next) => {
    const chatId = parseInt(req.params.id);
    const userId = req.user.id;
    if(!chatId) return res.status(422).json({success: false, message: "Insufficient data!"})
    try {
        const chat = await prisma.chat.findUnique({
            where: {
                id: parseInt(chatId),
                userId: userId
            },
            include: {
                messages: true
            }
        })
        if(!chat) return res.status(404).json({success: false, message: "Chat not found!"})
        return res.status(200).json({
            success: true,
            message: 'Chat fetched successfully!',
            chat
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Error fetching chat!'})
    }
}

const deleteChat = async (req,res,next) => {
    const chatId = parseInt(req.params.id);
    const userId = req.user.id;
    if(!chatId) return res.status(422).json({success: false, message: "Insufficient data!"})
    try {
        const chat = await prisma.chat.findUnique({
            where: {
                id: parseInt(chatId),
                userId: userId
            }
        })
        if(!chat) return res.status(404).json({success: false, message: "Chat not found!"})
        await prisma.chat.delete({
            where: {
                id: parseInt(chatId)
            }
        })
        return res.status(200).json({
            success: true,
            message: 'Chat deleted successfully!',
            chat
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Error deleting chat!'})
    }
}

const updateChatTitle = async (req,res,next) => {
    const userId = req.user.id;
    const {title} = req.body;
    const chatId = parseInt(req.params.id);
    if(!chatId || !title) return res.status(422).json({success: false, message: "Insufficient data!"})
    try {
        const chat = await prisma.chat.findUnique({
            where: {
                id: parseInt(chatId),
                userId: userId
            }
        })
        if(!chat) return res.status(404).json({success: false, message: "Chat not found!"})
        await prisma.chat.update({
            where: {
                id: parseInt(chatId)
            },
            data: {
                title: title
            }
        })
        return res.status(200).json({
            success: true,
            message: 'Chat title updated successfully!',
            chat
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: 'Error updating chat title!'})
    }
}


module.exports = {createChat, fetchChats, fetchChat, deleteChat, updateChatTitle}
