const mongoose = require("mongoose")

const chapterSchema = new mongoose.Schema({
    name: String,
    chapterCode: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // Reference to the subject
    contentIds: [{ _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' } }], // References to contents
    exerciseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }], // References to exercises
    wordMeaningIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }] // References to exercises
});

const Chapter = mongoose.model('Chapter', chapterSchema);