const joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");
const generateToken = require("../utils/generateToken");

const registerSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().required().email(),
    password: joi.string().required().min(6),
})

const loginSchema = joi.object({
    email: joi.string().required().email(),
    password: joi.string().required().min(6)
})

const registerUser = async (req,res,next)=>{
    const {name,email,password} = req.body;
    const {error} = registerSchema.validate({name,email,password})
    if(error){
        return res.status(400).json({success: false,message: error.details[0].message})
    }
    try {
        const emailExists = await prisma.user.findUnique({where: {email: email}})
        if(emailExists){
            return res.status(409).json({success: false,message: "User already exists"})
        }else{
            const hashedPassword = await bcrypt.hash(password,10);
            const newUser = await prisma.user.create({
                data:{
                    name,
                    email,
                    password: hashedPassword
                }
            })
            if(newUser){
                const token = generateToken(newUser.id);
                res.cookie('token',token,{
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 24*60*60*1000
                })
                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    data: {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email
                    }
                })
                next()
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,message: "Internal Server Error"
        })
    }
}

const loginUser = async (req,res,next)=>{
    const {email,password} = req.body;
    const {error} = loginSchema.validate({email,password})
    if(error){
        return res.status(400).json({success:false,message:error.details[0].message})
    }
    try{
        const user = await prisma.user.findUnique({where: {email: email}})
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }
        const verifyPassword = bcrypt.compare(password,user.password)
        if(!verifyPassword){
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }
        const token = generateToken(user.id);
        res.cookie('token',token,{
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24*60*60*1000
        })
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
        next()
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

const logoutUser = async (req,res,next)=>{
    res.clearCookie('token',{
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 0
    })
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    })
    next()
}

module.exports = {registerUser,loginUser,logoutUser}