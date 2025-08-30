const Subject = require("../models/subjectModel")

const getSubject = async (req, res) => {
    try {
        const classNumber = req.params.classNumber;
        const subjectData = await Subject.find({ class: classNumber });
        if (!subjectData) {
            return res.status(404).json("Data Not found");
        }
        res.json({ data: subjectData });

    } catch (err) {
        res.status(500).json("Internal Server Error")
    }
}



const postSubject = async (req, res) => {
    
    try {
        const subjectChecking = await Subject.findOne({code: req.body.code});

        console.log(subjectChecking);

        if(subjectChecking){
            return res.json({data: "Subject already Exist"})
        }

        const newSubject = new Subject({
            title: req.body.title,
            class: req.body.class,
            code: req.body.code,
            subPic: req.file ? req.file.path : null
        });

        const insertSubjectData = await newSubject.save();

        if (!insertSubjectData) {
            return res.status(500).json({ error: "Something went wrong inserting data" });
        }

        res.status(201).json(insertSubjectData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}
module.exports = { getSubject, postSubject }