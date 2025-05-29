import jwt from "jsonwebtoken";

const middleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.userId = decoded._id;
        next();

    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};

export default middleware;