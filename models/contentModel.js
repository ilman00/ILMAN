const mongoose = require("mongoose")

const contentSchema = new mongoose.Schema({
    text: String,
    img: String,
    video: String,
    chapterId: { _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' } } // Reference to the chapter
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content