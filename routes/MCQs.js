const Exercise = require("../models/exerciseModel");
const Chapter = require("../models/chapterModel");

const getExercise = async (req, res)=>{
    try {
        const chapterCode = req.params.chapterCode;

        const chapterExercise = await Exercise.find({ chapterCode: chapterCode });

        if (!chapterExercise) {
            return res.status(404).json({ Error: "Error Retreiving Data From database" })
        }

        res.json({ data: chapterExercise })


    } catch (err) {
        res.status(500).json({ error: err });
    }
}

const postExercise =  async (req, res) => {
    try {
        const chapterCode = req.params.chapterCode;

        const newExercise = new Exercise({
            question: req.body.question,
            options: {
                option1: req.body.option1,
                option2: req.body.option2,
                option3: req.body.option3,
                option4: req.body.option4
            },
            correctOption: req.body.correctOption,
            chapterId: chapterCode
        });
        console.log(newExercise);

        const chapterResult = await Chapter.findOne({ chapterCode: chapterCode })
        console.log("Chapter Data:", chapterResult);

        const resultOfSavingData = await newExercise.save()

        res.json({ "Data Save successfully": resultOfSavingData })

    } catch (err) {
        console.error(err);
        res.status(500).json("Error Saving Data in database")
    }
}

module.exports = {getExercise, postExercise}