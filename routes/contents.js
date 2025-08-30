const Chapter = require("../models/chapterModel")
const Content = require("../models/contentModel");



const getContent = async (req, res) => {
    try {
        const chapterCode = req.params.chapterCode;

        const chapterData = await Chapter.findOne({ chapterCode: chapterCode }, { contentIds: 1 });
        if (!chapterData) {
            return res.status(404).json("Error retrieving data from database");
        }

        const contenIds = chapterData.contentIds.map(obj => obj._id)

        const contentData = await Content.find({ _id: { $in: contenIds } })
        res.json({ data: contentData });
    } catch (err) {
        res.status(500).json("Error retrieving Data ")
    }
};

const postContent = async (req, res) => {
    try {
        const chapterCode = req.params.chapterCode;
        const newContent = new Content({
            text: req.body.text,
            img: req.files.image ? req.files.image[0].path : undefined,
            video: req.files.video ? req.files.video[0].path : undefined,
        });

        console.log(newContent);

        const result = await newContent.save();

        const chapResult = await Chapter.findOne({ chapterCode: chapterCode }, { contentIds: 1 });

        if (!chapResult) {
            return res.status(404).json("Error retrieving data from database");
        }

        chapResult.contentIds.push({ _id: result._id });

        await chapResult.save();

        res.json({ "Content Result": result, "Chapter Result": chapResult });

    } catch (err) {
        res.status(500).json({ err });
    }
}

module.exports = {getContent, postContent}