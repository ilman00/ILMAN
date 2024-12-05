const { User, RefreshToken } = require("../models/userModel")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { findOneAndUpdate } = require("../models/subjectModel");


const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        // Gracefully handle the missing token
        return res.status(401).json({
            success: false,
            message: 'Access token is missing. Please log in to access this resource.'
        });
    }

    jwt.verify(token, process.env.SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token. Please log in again.'
            });
        }
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    });
};


const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.SECRET, { expiresIn: "30m" });
}

const generateRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_SECRET, { expiresIn: "90d" });
}

const saveRefreshToken = async (userId, token) => {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);

    const refreshToken = new RefreshToken({
        user_id: userId,
        refresh_token: token,
        expires_at: expiration
    });

    await refreshToken.save();
}


const register = async (req, res) => {
    const { username, password } = req.body;

    try {

        const userData = await User.findOne({ username: username });

        if (userData) {
            return res.status(400).json({ Error: "User Already Exist" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username,
            password: hashPassword
        });

        await newUser.save();

        const accessToken = generateAccessToken({ user: newUser.username });
        const refreshToken = generateRefreshToken({ user: newUser.username });

        await saveRefreshToken(newUser._id, refreshToken);

        res.json({
            user: newUser, message: "logged in successfully",
            accessToken: accessToken,
            refreshToken: refreshToken
        });


    } catch (err) {
        res.status(500).json({ Error: `Internal server error ${err}` });
    }
}


const logIn = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Check if the user exists
        const userData = await User.findOne({ username });
        if (!userData) {
            return res.status(404).json({ Error: "User does not exist" });
        }
        // Validate password
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(400).json({ Error: "Invalid username or password" });
        }
        // Check for a refresh token for the user
        const tokenVerification = await RefreshToken.findOne({ user_id: userData._id });
        if (!tokenVerification) {
            return res.status(400).json({ Error: "No refresh token found, please register First" });
        }
        // Verify refresh token
        jwt.verify(tokenVerification.refresh_token, process.env.REFRESH_SECRET, async (err) => {
            if (err) {
                return res.status(400).json({ Error: "Invalid refresh token" });
            }
            // Generate an access token
            const accessToken = generateAccessToken({ user: userData.username });

            const newRefreshToken = generateRefreshToken({user: userData.username})

            const updateToken = await  RefreshToken.findOneAndUpdate({user_id: userData._id}, {refresh_token: newRefreshToken})

            console.log(newRefreshToken);
            console.log(updateToken);


            // Set the access token in an HTTP-only secure cookie
            // res.cookie("accessToken", accessToken, { httpOnly: true, secure: true });
            // Send a response including user information

            res.setHeader("Authorization", `Bearer ${accessToken}`)
            res.setHeader("Refresh-Token", newRefreshToken);
            res.json({
                Success: "User logged in successfully",
                user: {
                    id: userData._id,
                    username: userData.username,
                    email: userData.email, // or other public fields you want to share
                },
                accessToken: accessToken,
                resfreshToken: newRefreshToken
            });
        });
    } catch (err) {
        res.status(500).json({ Error: "Internal server error during login: " + err });
    }
}
const logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Decode token to find the user (optional, based on your app)
        const decoded = jwt.verify(token, process.env.SECRET);

        // Remove the refresh token from the database
        await RefreshToken.deleteOne({ user_id: decoded.user_id });

        res.json({ message: "User logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error during logout" });
    }
};


module.exports = { logIn, register, authenticateToken, logout }