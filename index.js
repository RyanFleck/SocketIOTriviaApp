const express = require('express');

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);
const helmet = require('helmet');

// Security++ => https://helmetjs.github.io/

const TRIVIA_QUESTIONS = 3;

// const { Client } = require('pg');
require('dotenv').config();


const port = process.env.PORT || 3000;


// Temp data to load into psql for development.
// const highscores = require('./data/highscores.json');
// const messages = require('./data/messages.json');
const questions = require('./data/questions.json');

const numQuestions = questions.length;
console.log(`${numQuestions} questions loaded.`);
const highScoreData = [];


// Init postgres server.
// https://mherman.org/blog/postgresql-and-nodejs/
/*
const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

pgClient.connect();

console.log(`This should run... ${process.env.DATABASE_URL}`);
let q = pgClient.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
    console.log('Querying...');
    if (err) throw err;
    for (const row of res.rows) {
        console.log(JSON.stringify(row));
    }
    pgClient.end();
});
q.on('end', () => console.log('Query finished.'));
*/

// Chat Data Blob (Last 5 messages.) [ [ Name, Color, Message ] ]
let usersOnline = 0;
const chat = [
    ['Starty Coreman', 'red', 'Booting system...'],
    ['Node Jenise', 'blue', 'Express is alright.'],
    ['Scotty Othello', 'green', 'Socket.IO is alright.'],
    ['Teddy Ousadmin', 'purple', 'Double-checking the math...'],
    ['Preflite Chex', 'gray', 'All systems are go for liftoff.'],
];

function addToHistory(name, color, message) {
    chat.push([name, color, message]);
    chat.shift();
}


// User Data Blob

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

    updateColor() {
        return this.color;
    }

    updateTeam() {
        return this.team;
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
    
    checkAnswer(a){
        console.log(`User answered ${a}. Correct == ${this.correctAns}`)
        if( a == this.correctAns){
            this.score+=1;
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
            io.to(this.socket).emit('trivia-over', ['Final score: ', this.score, '/',TRIVIA_QUESTIONS].join(''));
            this.announce(`scored ${this.score}/${TRIVIA_QUESTIONS}!`);
            this.postHighScore(this.score);
            // Need to redesign the input handling system.
        }
    }

    postHighScore(s){
        let hsdata = {
            'score':s,
            'name':this.name,
            'color':this.color
        }
        highScoreData.push(hsdata);
        highScoreData.sort((a,b)=> b.score - a.score);
        io.emit('new-highscore',highScoreData);
    }
}


// SOCKET.IO

io.on('connection', (socket) => {
    const user = new UserBlob(socket.id);
    usersOnline += 1;

    chat.map(x => io.to(user.socket).emit('message out', {
        username: x[0],
        usercolor: x[1],
        message: x[2],
    }));

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

    socket.on('login', (username) => {
        console.log(`${user.name} logged in as: ${username}`);
        user.updateName(username);
        io.to(user.socket).emit('logged-in', user.name);
        user.announce('has joined the chat!');
        io.emit('new-highscore',highScoreData);
        user.sendNextQuestion();
        
    });

    socket.on('submit-answer', (lastAnswer) => {
        if(user.checkAnswer(lastAnswer)){
            user.sendNextQuestion();
        }else{
            user.sendNextQuestion();
        }
    });
});

// EXPRESS

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
