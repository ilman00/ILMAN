require('dotenv').config()
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const app = express();

const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const dbString ="mongodb://127.0.0.1:27017/NEW_LMS";

mongoose.connect(dbString);


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

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
});

// userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

// passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser())



const exerciseSchema = new mongoose.Schema({
    question: String,
    options: {
        option1: String,
        option2: String,
        option3: String,
        option4: String
    },
    correctOption: String,
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' } // Reference to the chapter
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

const textQuestionSchema = new mongoose.Schema({
    question: String,
    answer: String,
    chapterId: { _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' } }
});


const contentSchema = new mongoose.Schema({
    text: String,
    img: String,
    video: String,
    chapterId: { _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' } } // Reference to the chapter
});

const Content = mongoose.model('Content', contentSchema);

const wordMeaningSchema = new mongoose.Schema({
    word: String,
    meaning: String,
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }

});

const WordMeaning = new mongoose.model("WordMeaning", wordMeaningSchema);

const chapterSchema = new mongoose.Schema({
    name: String,
    chapterCode: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // Reference to the subject
    contentIds: [{ _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' } }], // References to contents
    exerciseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }], // References to exercises
    wordMeaningIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }] // References to exercises
});

const Chapter = mongoose.model('Chapter', chapterSchema);

const subjectSchema = new mongoose.Schema({
    title: String,
    class: String,
    code: String,
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }] // References to chapters
});

const Subject = mongoose.model('Subject', subjectSchema);

const authenticateJWT = (req, res, next) => {
    const token = req.header("authorization");

    if (!token) {
        return res.status(403).json({ message: "Token required" });
    }

    try {

        const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY)
        req.user = decoded;

        next();
    } catch (err) {
        res.status(403).json({ Message: "Invalid token" });
    }
}

// Registring a User
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    const userExist = await User.findOne({ username: username });

    if (userExist) {
        return res.status(400).json({ message: "User Already Exist" });
    }

    try {
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username: username,
            password: hashPassword,
            email: email
        });

        await newUser.save();

        res.status(201).json({ message: "User Registered Successfully" });

    } catch (err) {
        res.status(500).json({ message: "Error inserting Data", Error: err });
    }
});

// loging In users API
app.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    try {



        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(400).json({ message: "User not existed" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "invalid cedentials" });
        }

        const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET_KEY, { expiresIn: "30d" })

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({ accessToken, refreshToken });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }

});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/course.html");
})


// Save Subject in Database
app.post("/api/subject/data", async (req, res) => {
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
});





// Retrieving subject from database
app.get("/api/subject/data", async (req, res) => {
    try {
        const subjectData = await Subject.find({}, { title: 1, code: 1 });
        if (!subjectData) {
            return res.status(404).json("Data Not found");
        }
        res.json({ data: subjectData });

    } catch (err) {
        res.status(500).json("Error")
    }
});

// Retrieving chapter from database
app.get("/api/:subjectCode/chapter/data", async (req, res) => {
    try {
        const subjectCode = req.params.subjectCode;
        const subData = await Subject.findOne({ code: subjectCode }, { chapters: 1 });
        if (!subData) {
            return res.status(404).json("Data Not found");
        }

        const objectIds = subData.chapters.map(obj => obj._id);

        const chapterData = await Chapter.find({ _id: { $in: objectIds } });
        res.json(chapterData)
    } catch (err) {
        res.status(500).json("Error")
    }
});

// Retrieving Exercise From database
app.get("/api/:chapterId/exercise/data", async (req, res) => {
    try {
        const chapterId = req.params.chapterId;

        const chapterExercise = await Exercise.find({ chapterId: chapterId });

        if (!chapterExercise) {
            return res.status(404).json({ Error: "Error Retreiving Data From database" })
        }

        res.json({ data: chapterExercise })


    } catch (err) {
        res.status(500).json({ error: err });
    }
})



//  Retrieving Content Data from Database
app.get("/api/:chapterCode/content/data", async (req, res) => {
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
});


app.get("/api/:chapterId/wordMeaning/data", async (req, res)=>{
    try{
        const chapterId = req.params.chapterId;

        const wordMeaningData = await WordMeaning.find({chapterId: chapterId});

        if(!wordMeaningData){
            return res.status(400).json({Error: "No data found "});
        }

        res.json({data: wordMeaningData});
    }catch(err){
        res.status(500).json({Error: "An Error occurred"})
    }
})

// saving chapter data in database
app.post("/api/:subCode/chapter/data", async (req, res) => {
    try {
        const subCode = req.params.subCode;
        const name = req.body.chapName;
        const chapterCode = req.body.chapterCode;

        // Save the new chapter
        const newChapter = new Chapter({
            name: name,
            chapterCode: chapterCode
        });

        const result = await newChapter.save();
        console.log("Chapter saved:", result);

        // Find the subject by code
        const subResult = await Subject.findOne({ code: subCode });
        console.log("Subject Result:", subResult);

        if (!subResult) {
            return res.status(404).json({ error: "Subject not found" });
        }

        // Add the chapter _id to the subject's chapters array
        subResult.chapters.push({ _id: result._id });

        // Save the updated subject
        await subResult.save();

        // Respond with the chapter and subject
        res.json({ "Chapter Result": result, "Subject Result": subResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred" });
    }
});



const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 }, // Accept 1 image file
    { name: 'video', maxCount: 1 }  // Accept 1 video file
]);

// Saving Content Data in the database
app.post("/api/:chapterCode/content/data", uploadFields, async (req, res) => {
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
});

// Saving word Meaning of English Book in Database
app.post("/api/:chapterId/wordMeaning/data", async (req, res) => {
    try {
        const chapterId = req.params.chapterId;

        // Validate chapterId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(chapterId)) {
            return res.status(400).json({ error: "Invalid Chapter ID" });
        }

        // Find the chapter first
        const chapterData = await Chapter.findById(chapterId);
        if (!chapterData) {
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
            chapterId: chapterId
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
});



// Saving Exercise Data from Database
app.post("/api/:chapterId/exercise/data", async (req, res) => {
    try {
        const chapterId = req.params.chapterId;

        const newExercise = new Exercise({
            question: req.body.question,
            options: {
                option1: req.body.option1,
                option2: req.body.option2,
                option3: req.body.option3,
                option4: req.body.option4
            },
            correctOption: req.body.correctOption,
            chapterId: chapterId
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









app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on 3000`);
});