const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);
const helmet = require('helmet'); // Security++ => https://helmetjs.github.io/

const TRIVIA_QUESTIONS = 3;
const port = process.env.PORT || 3000;
let highScoreData = [];

/*
 * SET UP POSTGRES
 */
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (process.env.NODE_ENV === 'production'), // Change for MNP deployment.
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const psqlMessage = 'insert into messages (username, color, message, time) values ($1, $2, $3, current_timestamp);';
const psqlScore = 'insert into highscores (username, color, score, time) values ($1, $2, $3, current_timestamp);';
const psqlInit = fs.readFileSync('./data/init_db.sql').toString();
const psqlGetHigscores = 'select * from highscores order by score desc limit 5;';
const psqlGetMessages = 'select * from messages order by time desc limit 5;';

// Setup postgres tables, if they don't already exist.
(async () => {
    const client = await pool.connect();
    try {
        await client.query(psqlInit);
    } finally {
        client.release();
    }
})().catch(e => console.log(e.stack));

const updateHighScores = async () => {
    const client = await pool.connect();
    const res = await client.query(psqlGetHigscores);
    highScoreData = res.rows;
    client.release();
    console.log(highScoreData);
    io.emit('new-highscore', highScoreData);
};

// Message pane populates with the last ten when a user logs in.
const initializeMessagePane = async (socket) => {
    const client = await pool.connect();
    const res = await client.query(psqlGetMessages);
    res.rows.reverse().forEach(x => io.to(socket).emit('message out', {
        username: x.username,
        usercolor: x.color,
        message: x.message,
    }));
};

/*
 * SET UP QUESTIONS
 */
const questions = require('./data/questions.json');

const numQuestions = questions.length;
console.log(`${numQuestions} questions loaded.`);


// Chat Data Blob (Last 5 messages.) [ [ Name, Color, Message ] ]
let usersOnline = 0;

function addToHistory(name, color, message) {
    (async () => {
        const client = await pool.connect();
        try {
            client.query(psqlMessage, [name, color, message]);
        } finally {
            client.release();
        }
    })().catch(e => console.log(e.stack));
}

/*
 * USERBLOB
 *
 * When a new user connects, the socket and all other information is placed in this object.
 * All important functions related to the user have been created as methods for now.
 */
class UserBlob {
    constructor(s) {
        this.socket = s;
        this.name = s.replace(/\W/g, '').slice(0, 5).toUpperCase();
        this.color = '#43ca43';
        this.team = 'None';
        this.loggedin = false;
        this.questionSet = [];
        this.correctAns = '';
        this.currentQ = undefined;
        this.score = 0;
        this.getQuestionSet();
    }

    formatMessageObject(fmessage) {
        return {
            name: this.name,
            color: this.color,
            message: fmessage,
        };
    }

    updateColor(color) {
        this.color = color;
    }

    sendMessage(messageout) {
        if (this.loggedin && messageout) {
            io.emit('message out', {
                username: this.name,
                usercolor: this.color,
                message: messageout,
            });
            addToHistory(this.name, this.color, messageout);
        } else if (!this.loggedin) {
            io.to(this.socket).emit('announce', {
                username: this.name,
                usercolor: this.color,
                message: ', you need to log in first!',
            });
        } else {
            io.to(this.socket).emit('announce', {
                username: this.name,
                usercolor: this.color,
                message: ', your message is empty!',
            });
        }
    }

    announce(messageout) {
        io.emit('announce', {
            username: this.name,
            usercolor: this.color,
            message: messageout,
        });
    }

    updateName(newname) {
        this.name = newname;
        this.loggedin = true;
    }

    getQuestionSet() {
        const uidArr = [];
        while (uidArr.length < TRIVIA_QUESTIONS) {
            const temp = Math.floor(Math.random() * numQuestions);
            if (uidArr.indexOf(temp) === -1) {
                uidArr.push(temp);
            }
        }
        console.log(`Adding Questions ${uidArr.join(' ')}`);
        this.questionSet = questions.filter(x => uidArr.indexOf(x.id) > -1);
    }

    checkAnswer(a) {
        console.log(`User answered ${a}. Correct == ${this.correctAns}`);
        if (a == this.correctAns) {
            this.score += 1;
            return true;
        }
        return false;
    }

    sendNextQuestion() {
        if (this.questionSet[0]) {
            const nextquestion = this.questionSet.shift();
            console.log(nextquestion);
            this.currentQ = nextquestion.id;
            this.correctAns = nextquestion.correct;
            const censored = nextquestion;
            delete censored.answer;
            io.to(this.socket).emit('new-question', censored);
        } else {
            io.to(this.socket).emit('trivia-over', ['Final score: ', this.score, '/', TRIVIA_QUESTIONS].join(''));
            this.announce(`scored ${this.score}/${TRIVIA_QUESTIONS}!`);
            this.postHighScore(this.score);
            // Need to redesign the input handling system.
        }
    }

    postHighScore(s) {
        (async () => {
            const client = await pool.connect();
            try {
                client.query(psqlScore, [this.name, this.color, s]);
            } finally {
                client.release();
            }
        })().catch(e => console.log(e.stack));
        updateHighScores();
    }
}

/*
 * SET UP SOCKET.IO
 */
io.on('connection', (socket) => {
    const user = new UserBlob(socket.id);
    usersOnline += 1;

    initializeMessagePane(user.socket);

    // io.emit('message out', "User "+user.name+" has joined. Users online: "+usersOnline);

    console.log(`Connection event. User ${user.name}`);
    socket.on('disconnect', () => {
        usersOnline -= 1;
        user.announce('has disconnected.');
        console.log(`User ${user.name} disconnected.`);
    });

    socket.on('message', (message) => {
        console.log(`${user.name} sent message: ${message}`);
        user.sendMessage(message);
    });

    socket.on('login', (username, color) => {
        console.log(`${user.name} logged in as: ${username} with color ${color}`);
        user.updateName(username);
        user.updateColor(color);
        io.to(user.socket).emit('logged-in', user.name);
        user.announce('has joined the chat!');
        io.emit('new-highscore', highScoreData);
        user.sendNextQuestion();
    });

    socket.on('submit-answer', (lastAnswer) => {
        if (user.checkAnswer(lastAnswer)) {
            user.sendNextQuestion();
        } else {
            user.sendNextQuestion();
        }
    });
});


/*
 * SET UP EXPRESS
 */
app.use(express.static('resources'));
app.use(helmet());

app.get('/', (req, res) => {
    // req is http request info.
    // res is http response.
    res.sendFile(`${__dirname}/index.html`);
});

http.listen(port, () => {
    console.log(`Success! Listening on ${port}. ${usersOnline} users online.`);
});
