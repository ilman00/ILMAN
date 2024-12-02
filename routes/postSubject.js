
const Subject = require("../models/subjectModel")
const path = require("path");
exports.postSubject =  async (req, res)=>{
    const newSubject = new Subject({
        title: req.body.title,
        class: req.body.class,
        code: req.body.code,
        subPic: req.file ? req.file.path : null
    });

    try {
        const insertSubjectData = await newSubject.save();

        if (!insertSubjectData) {
            return res.status(500).json({ error: "Something went wrong inserting data" });
        }

        res.status(201).json(insertSubjectData);
        console.log(insertSubjectData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = postSubject