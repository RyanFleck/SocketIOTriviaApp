const app = require('express')();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(http);

let users_online = 0;

// SOCKET.IO


io.on('connection', (socket)=>{
    let user = socket.id;
    users_online += 1;
    io.emit('message out', "User "+user+" has joined. Users online: "+users_online);

    console.log("Connection event. User "+user);
    socket.on('disconnect',(user)=>{
        users_online -= 1;
        console.log("User "+user+" disconnected.");
    });

    socket.on('message', (message)=>{
        console.log(user+" sent message: "+message);
        io.emit('message out', message);
    });
});

// EXPRESS

app.get('/',(req,res)=>{

    // req is http request info.
    // res is http response.

    res.sendFile(__dirname+'/index.html');

});

app.get('/trivia',(req,res)=>{

    // req is http request info.
    // res is http response.

    res.send("<h1>Not Yet</h1>");

});

http.listen(port, ()=>{
    console.log("Success! Listening on "+port)
});