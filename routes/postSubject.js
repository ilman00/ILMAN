
const Subject = require("../models/subjectModel")
exports.postSubject =  async (req, res)=>{
    const newSubject = new Subject({
        title: req.body.title,
        class: req.body.class,
        code: req.body.code
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
