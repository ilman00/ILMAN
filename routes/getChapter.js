const Subject = require("../models/subjectModel")
const Chapter = require("../models/chapterModel")

const getChapter = async (req, res)=>{
    try {
        const subjectCode = req.params.subjectCode;
        const subData = await Subject.findOne({ code: subjectCode }, { chapters: 1 });
        if (!subData) {
            return res.status(404).json("Data Not found");
        }

        const objectIds = subData.chapters.map(obj => obj._id);

        const chapterData = await Chapter.find({ _id: { $in: objectIds } });
        res.json(chapterData)
    } catch (err) {
        res.status(500).json("Error")
    }
}

const postChapter = async (req, res)=>{
    try {
        const subCode = req.params.subCode;
        const name = req.body.chapName;
        const chapterCode = req.body.chapterCode;

        // Save the new chapter
        const newChapter = new Chapter({
            name: name,
            chapterCode: chapterCode,
            subjectCode: subCode
        });

        const result = await newChapter.save();
        console.log("Chapter saved:", result);

        // Find the subject by code
        const subResult = await Subject.findOne({ code: subCode });
        console.log("Subject Result:", subResult);

        if (!subResult) {
            return res.status(404).json({ error: "Subject not found" });
        }

        // Add the chapter _id to the subject's chapters array
        subResult.chapters.push({ _id: result._id });

        // Save the updated subject
        await subResult.save();

        // Respond with the chapter and subject
        res.json({ "Chapter Result": result, "Subject Result": subResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred" });
    }
}

module.exports = { getChapter, postChapter }