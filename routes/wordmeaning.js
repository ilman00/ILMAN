const WordMeaning = require("../models/wordMeaningModel");
const Chapter = require("../models/chapterModel")

const getWordMeaning = async (req, res)=>{
    try{
        const chapterCode = req.params.chapterId;

        const wordMeaningData = await WordMeaning.find({chapterCode: chapterCode});

        if(!wordMeaningData){
            return res.status(400).json({Error: "No data found "});
        }
        res.json({data: wordMeaningData});
    }catch(err){
        res.status(500).json({Error: "An Error occurred"})
    }
}

const postWordMeaning =  async (req, res) => {
    try {
        const chapterCode = req.params.chapterCode;

        // Validate chapterId is a valid ObjectId
        if (!chapterCode) {
            return res.status(400).json({ error: "Invalid Chapter Code" });
        }

        // Find the chapter first
        const chapterData = await Chapter.findOne({chapterCode: chapterCode});
        if (!chapterData) {
            console.log(chapterData);
            return res.status(400).json({ error: "Chapter not found" });
        }

        // Validate request body fields
        if (!req.body.word || !req.body.meaning) {
            return res.status(400).json({ error: "Word and Meaning are required" });
        }

        // Create a new WordMeaning
        const newWordMeaning = new WordMeaning({
            word: req.body.word,
            meaning: req.body.meaning,
            chapterCode: chapterCode
        });

        // Save WordMeaning to the database
        const savedWordMeaning = await newWordMeaning.save();

        // Push the WordMeaning's _id to the chapter's wordMeaningIds array
        chapterData.wordMeaningIds.push(savedWordMeaning._id);

        // Save the updated chapter
        await chapterData.save();

        res.status(201).json({ message: "Data saved successfully", wordMeaning: savedWordMeaning });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


module.exports = {getWordMeaning, postWordMeaning}