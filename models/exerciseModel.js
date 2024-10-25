const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
    question: String,
    options: {
        option1: String,
        option2: String,
        option3: String,
        option4: String
    },
    correctOption: String,
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' } // Reference to the chapter
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise