require('dotenv').config()
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const Subject = require("./models/subjectModel");
const Chapter = require("./models/chapterModel")
const { postSubject } = require("./routes/postSubject");
const { getSubject } = require("./routes/getSubject");
const { getChapter, postChapter } = require("./routes/getChapter");
const { getWordMeaning, postWordMeaning } = require("./routes/wordmeaning");
const { logIn, register, authenticateToken, logout } = require("./routes/auth");
const { getContent, postContent } = require("./routes/contents");
const { getExercise, postExercise } = require('./routes/MCQs');
const { QAget, QApost } = require("./routes/QA");
const cookieParser = require("cookie-parser");

// const jwt = require("jsonwebtoken")


const app = express();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedOrigins = [
    'http://localhost:5173',                  // Local React app
    'https://e-digital-pakistan-project.vercel.app',  // Live React app
  ];
  
  app.use(
    cors({
      origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
          callback(null, true); // Allow the request
        } else {
          callback(new Error('Not allowed by CORS')); // Reject the request
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true, // Allow cookies and credentials
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Authorization'], // Expose necessary headers
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );
  

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

const dbString ="mongodb://127.0.0.1:27017/NEW_LMS";
// const liveDBString = process.env.DATABASE_STRING;
mongoose.connect(dbString);




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fileType = file.mimetype.split('/')[0]; // Get the file type (image or video)
        let uploadPath;
        const routPath = req.route.path;

        if (fileType === 'image') {
            if (routPath.includes("content")) {
                uploadPath = "uploads/images/content/"
            } else if (routPath.includes("subject")) {

                uploadPath = 'uploads/images/subject/';
            }

        } else if (fileType === 'video') {
            uploadPath = 'uploads/videos/';
        } else {
            return cb(new Error('File type not supported'), false);
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true })
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

// Retrieving subject from database
app.get("/api/:classNumber/subject/data", getSubject);
// Retrieving chapter from database
app.get("/api/:subjectCode/chapter/data", getChapter);
// Retrieving Exercise From database
app.get("/api/:chapterCode/exercise/data", getExercise)
//  Retrieving Content Data from Database
app.get("/api/:chapterCode/content/data", getContent)
// Getting Word Meaning
app.get("/api/:chapterId/wordMeaning/data", getWordMeaning);
//Getting QA
app.get("/api/:chapterId/q-a/data", QAget);




// Save Subject in Database
app.post("/api/subject/data", upload.single("subject"), postSubject);

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
app.post("/api/:chapterCode/exercise/data", postExercise)
// Saving QA
app.post("/api/:chapterId/qa/data", QApost);


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