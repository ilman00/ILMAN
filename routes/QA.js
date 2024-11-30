const QA = require("../models/QAModel");

const QAget = async (req, res) => {
    try {

        const chapterCode = req.params.chapterCode;

        const chapterData = await QA.find({ chapterId: chapterCode });

        if (!chapterData) {
            res.status(400).json("chapterId not found")
        }

        res.status(200).json({ data: chapterData })
    }catch(err){
        res.status(500).json("Internal Server Error: "  + err);
    }
}

const QApost = async (req, res) => {
    try {

        const newQA = new QA({
            chapterId: req.params.chapterId,
            question: req.body.question,
            answer: req.body.answer

        });

        const saveQA = await newQA.save();
        res.status(200).json({ data: saveQA })
    } catch (err) {
        res.status(500).json("Internal Server Error: "  + err);
    }
}

module.exports = {QAget, QApost}