const app = require('express')();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(http);


// SOCKET.IO

/*
// Heroku compatability.
io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});*/

io.on('connection', (socket)=>{
    console.log("Connection event. "+socket.id);
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