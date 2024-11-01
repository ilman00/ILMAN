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
const bcrypt = require("bcrypt")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// const dbString ="mongodb://127.0.0.1:27017/NEW_LMS";
const liveDBString = process.env.DATABASE_STRING;
mongoose.connect(liveDBString);


app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
})); 

app.use(passport.initialize());
app.use(passport.session()); 

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

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())



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
    chapterCode: String
});



app.post('/register', register);
app.post('/login', logIn);
app.post("/logout", logout)
const contentSchema = new mongoose.Schema({
    text: String,
    img: String,
    video: String,
    chapterCode: String  // Reference to the chapter
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
    const { username, password } = req.body;

    try {
        const user = new User({ username });
        await User.register(user, password);

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Login failed after registration', error: err.message });
            }
            return res.status(200).json({ success: true, message: 'User registered and logged in successfully', user: { username: user.username } });
        });
    } catch (err) {
        // Check if the error is due to duplicate username
        if (err.name === 'UserExistsError') {
            return res.status(400).json({ success: false, message: 'Username already exists. Please choose another one.' });
        }
        // For any other errors
        res.status(400).json({ success: false, message: 'Error registering user', error: err.message });
    }
});


// loging In users API
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
        }
        if (!user) {
            // If authentication fails, user will be null
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        // Log in the user
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
            }
            // If login is successful, send success response with user details
            return res.status(200).json({ success: true, message: 'Login successful', user: { username: user.username } });
        });
    })(req, res, next);
});







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
app.post("/api/:chapterCode/content/data", uploadFields, async (req, res) => {
    try {
        const chapterCode = req.params.chapterCode;
        const newContent = new Content({
            text: req.body.text,
            img: req.files.image ? req.files.image[0].path : undefined,
            video: req.files.video ? req.files.video[0].path : undefined,
            chapterCode: chapterCode
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




app.listen(process.env.PORT || 3000, () => {





app.listen(3000, () => {
    console.log(`Server running on 3000`);
});