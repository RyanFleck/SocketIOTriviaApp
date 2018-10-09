const app = require('express')();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(http);

let users_online = 0;

// Data

class UserBlob {
    constructor(name){
    this.name = name;
    this.color = "#43ca43";
    this.team = "None";
    }

    format_message_object( message ){
        return {
            name: this.name,
            color: this.color,
        }
    }

    update_color(){

    }

    update_team(){

    }

    send_message( messageout ){
        io.emit('message out', {
            username: this.name,
            usercolor: this.color,
            message: messageout
        });
    }

    announce( messageout ){
        io.emit('announce', {
            username: this.name,
            usercolor: this.color,
            message: messageout
        });
    }


}


// SOCKET.IO

io.on('connection', (socket)=>{
    const user = new UserBlob(socket.id.replace(/\W/g, '').slice(0,5).toUpperCase());
    users_online += 1;
    user.announce("has joined the chat!");
    //io.emit('message out', "User "+user.name+" has joined. Users online: "+users_online);

    console.log("Connection event. User "+user.name);
    socket.on('disconnect',()=>{
        users_online -= 1;
        user.announce("has disconnected.");
        console.log("User "+user.name+" disconnected.");
    });

    socket.on('message', (message)=>{
        console.log(user.name+" sent message: "+message);
        user.send_message(message);
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