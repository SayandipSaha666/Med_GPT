const jwt  = require('jsonwebtoken');
const {prisma} = require('../lib/prisma');

const authMiddleware = async (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - No token provided'
        })
    }else{
        try {
            const decode = jwt.verify(token,process.env.JWT_SECRET_KEY);
            const user = await prisma.user.findUnique({where: {id: decode.id}});
            if(!user){
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized - Invalid token"
                })
            }
            req.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            next();
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            })
        }
    }
}

module.exports = {authMiddleware};