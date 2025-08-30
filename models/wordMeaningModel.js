const mongoose = require("mongoose");

const wordMeaningSchema = new mongoose.Schema({
    word: String,
    meaning: String,
    chapterCode: String

});

const WordMeaning = new mongoose.model("WordMeaning", wordMeaningSchema);

module.exports = WordMeaning