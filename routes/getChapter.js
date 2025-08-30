const Subject = require("../models/subjectModel")
const Chapter = require("../models/chapterModel")

const getChapter = async (req, res) => {
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

let lowerCaseChapter = ""
let lowerCaseName = ""

const postChapter = async (req, res) => {
    try {
        const subCode = req.params.subCode;
        const name = req.body.chapName;

        const chapterChecking = await Chapter.find({ subjectCode: subCode });
        // console.log(chapterChecking);


       

        for (let i = 0; i < chapterChecking.length; i++) {
            console.log(chapterChecking[i]);
            lowerCaseChapter = chapterChecking[i].name.toLowerCase()
            console.log(lowerCaseChapter);
            lowerCaseName = name.toLowerCase()
            if (lowerCaseChapter === lowerCaseName) {
                return res.json({ Error: "Chapter already Exist" })
            }
        }

        const chapterArrayLength = chapterChecking.length + 1;

        const chapterCode = subCode + "CH" + chapterArrayLength;

        console.log(chapterCode);

        // Save the new chapter
        const newChapter = new Chapter({
            name: name,
            chapterCode: chapterCode,
            subjectCode: subCode
        });

        const result = await newChapter.save();

        // Find the subject by code
        const subResult = await Subject.findOne({ code: subCode });

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