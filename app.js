require('dotenv').config()
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const Subject = require("./models/subjectModel");
const Exercise = require("./models/exerciseModel");
const Chapter = require("./models/chapterModel")
const { postSubject } = require("./routes/postSubject");
const { getSubject } = require("./routes/getSubject");
const { getChapter, postChapter} = require("./routes/getChapter");
const { getWordMeaning, postWordMeaning } = require("./routes/wordmeaning");
const {logIn, register,  authenticateToken, logout} = require("./routes/auth");
const {getContent, postContent} = require("./routes/contents");
// const jwt = require("jsonwebtoken")


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// const dbString ="mongodb://127.0.0.1:27017/NEW_LMS";
const liveDBString = process.env.DATABASE_STRING;
mongoose.connect(liveDBString);




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fileType = file.mimetype.split('/')[0]; // Get the file type (image or video)
        let uploadPath;

        if (fileType === 'image') {
            uploadPath = 'uploads/images/';
        } else if (fileType === 'video') {
            uploadPath = 'uploads/videos/';
        } else {
            return cb(new Error('File type not supported'), false);
        }

        cb(null, uploadPath); // Directory where the images will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename the file with the current timestamp and original extension
    },
});

const upload = multer({ storage: storage });


app.post('/register', register);
app.post('/login', logIn);
app.post("/logout", logout)

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/course.html");
})
// Save Subject in Database
app.post("/api/subject/data", postSubject);
// Retrieving subject from database
app.get("/api/subject/data", getSubject );
// Retrieving chapter from database
app.get("/api/:subjectCode/chapter/data", getChapter);
// Retrieving Exercise From database
app.get("/api/:chapterCode/exercise/data", async (req, res) => {
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
})
//  Retrieving Content Data from Database
app.get("/api/:chapterCode/content/data", getContent)
// Getting Word Meaning
app.get("/api/:chapterId/wordMeaning/data", getWordMeaning )
// saving chapter data in database
app.post("/api/:subCode/chapter/data", postChapter);


const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 }, // Accept 1 image file
    { name: 'video', maxCount: 1 }  // Accept 1 video file
]);
// Saving Content Data in the database
app.post("/api/:chapterCode/content/data", uploadFields, postContent);


// Saving word Meaning of English Book in Database
app.post("/api/:chapterCode/wordMeaning/data", postWordMeaning);
// Saving Exercise Data from Database
app.post("/api/:chapterCode/exercise/data", async (req, res) => {
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

        const chapterResult = await Chapter.findOne({ _id: chapterId })
        console.log("Chapter Data:", chapterResult);

        const resultOfSavingData = await newExercise.save()

        res.json({ "Data Save successfully": resultOfSavingData })

    } catch (err) {
        console.error(err);
        res.status(500).json("Error Saving Data in database")
    }
})
// deleting Chapter data from database
app.delete("/api/:subCode/chapter/:chapterId", async (req, res) => {
    try {
        const { subCode, chapterId } = req.params;
        console.log("Received subCode:", subCode);
        console.log("Received chapterId:", chapterId);

        const deleteChapter = await Chapter.findByIdAndDelete(chapterId);
        if (!deleteChapter) {
            return res.status(404).json({ error: "Chapter not found" });
        }

        const subject = await Subject.findOne({ code: subCode });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        subject.chapters = subject.chapters.filter(chapter => !chapter._id.equals(chapterId));

        await subject.save();

        res.json({ message: "Chapter deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred" });
    }
});







app.listen(3000, () => {
    console.log(`Server running on 3000`);
});