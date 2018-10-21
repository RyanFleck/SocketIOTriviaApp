const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = process.env.PORT || 3000;
const io = require('socket.io')(http);

const highscores = require('./data/highscores.json');
const messages = require('./data/messages.json');

let usersOnline = 0;

// Chat Data Blob (Last 5 messages.) [ [ Name, Color, Message ] ]

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
        } else if ( !this.loggedin ){
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
    });
});

// EXPRESS

app.use(express.static('resources'));

app.get('/', (req, res) => {
    // req is http request info.
    // res is http response.
    res.sendFile(`${__dirname}/index.html`);
});

http.listen(port, () => {
    console.log(`Success! Listening on ${port}. ${usersOnline} users online.`);
});
