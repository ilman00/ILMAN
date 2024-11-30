const mongoose = require("mongoose");

const QASchema = new mongoose.Schema({
    chapterId: String,
    question: String,
    answer: String
});

const QA = new mongoose.model("QA", QASchema);

module.exports = QA;