const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
});

const User = new mongoose.model("User", userSchema);


const RefreshTokenSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User's ObjectId
    refresh_token: String,
    expires_at: Date
});

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = {User, RefreshToken};