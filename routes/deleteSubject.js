const Subject = require("../models/subjectModel");
const Chapter = require("../models/chapterModel");
const Content = require("../models/contentModel");

const deleteSubject = async (req, res) => {
    try {
        const subjectCode = req.params.subjectCode;
        const subjectData = await Subject.findOne({ code: subjectCode });
        if (!subjectData) {
            return res.status(404).json("Subject not found");
        }

        const chapterData = await Chapter.find({ subjectCode: subjectCode });
        if (chapterData.length > 0) {
            for (const chapter of chapterData) {
                for (const contentId of chapter.contentIds) {
                    if (contentId === null) continue;
                    await Content.deleteOne({ _id: contentId });
                }
                await Chapter.deleteMany({ chapterCode: chapter.chapterCode });
            }
        }
        await Chapter.deleteMany({ subjectCode: subjectCode });

        await Subject.deleteOne({ code: subjectCode });

        res.status(200).json("Subject deleted successfully");
    } catch (err) {
        res.status(500).json("Error");
    }
}