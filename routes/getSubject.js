const Subject = require("../models/subjectModel")

const getSubject = async (req , res)=>{
    try {
        const subjectData = await Subject.find({}, { title: 1, code: 1 });
        if (!subjectData) {
            return res.status(404).json("Data Not found");
        }
        res.json({ data: subjectData });

    } catch (err) {
        res.status(500).json("Internal Server Error")
    }
}

module.exports = {getSubject}
