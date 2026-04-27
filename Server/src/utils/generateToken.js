// const jwt = require('jsonwebtoken')
import jwt from "jsonwebtoken";
export default function generateToken(id){
    return jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn: 24*60*60
    })
}