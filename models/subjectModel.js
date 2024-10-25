const mongoose = require("mongoose")
const subjectSchema = new mongoose.Schema({
    title: String,
    class: String,
    code: String,
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }] // References to chapters
});

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject