const express = require('express');
const { google } = require('googleapis');
var cors = require('cors')

const app = express();
const port = 3000;

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
  }));

app.use(bodyParser.json());

// anable pre-flight request
app.options('*', cors());

// allow all cors
app.use(cors());

const CLIENT_ID = '1019642260606-5ulsios3g5q77pgunnc9e4ejs6cfblrl.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:88/redirect-google';

// no cors validation
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// validate token except for auth/google and redirect-google
app.use((req, res, next) => {
    if (req.path === '/auth/google' || req.path === '/redirect-google') {
        return next();
    }

    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).send('Unauthorized');
    } else {
        const token = authHeader.split(' ')[1];
        oauth2Client.setCredentials({ access_token: token });
    }

    next();
});

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Updated scopes
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.profile.emails',
  'https://www.googleapis.com/auth/classroom.topics'
];

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.send({ authUrl });
});

app.get('/redirect-google', async (req, res) => {
  const { code } = req.query;

    console.log('code', code);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.send({
        token: tokens
    });
  } catch (error) {
    console.error('Error during authentication', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/get-user-info', async (req, res) => {
    try {
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();
        res.json(data);
    } catch (error) {
        console.error('Error fetching user info', error);
        res.status(500).send('Error fetching user info');
    }
});

app.get('/get-courses', async (req, res) => {
    try {
        const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
        const { data } = await classroom.courses.list();
        res.json(data);
    } catch (error) {
        console.error('Error fetching courses', error);
        res.status(500).send('Error fetching courses');
    }
});

app.post('/create-course', async (req, res) => {

    try {
        const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
        const { data } = await classroom.courses.create({
            requestBody: {
                name: req.body.courseName,
                description: req.body.courseDescription,
                ownerId: 'me'
            }
        });
        res.json(data);
    } catch (error) {
        console.error('Error creating course', error);
        res.status(500).send('Error creating course');
    }
});

app.get('/get-coursework', async (req, res) => {
    try {
        const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
        const { data } = await classroom.courses.courseWork.list({
            courseId: 'COURSE_ID'
        });
        res.json(data);
    } catch (error) {
        console.error('Error fetching coursework', error);
        res.status(500).send('Error fetching coursework');
    }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});