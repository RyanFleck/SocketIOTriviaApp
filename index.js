const app = require('express')();
const http = require('http').Server(app);

app.get('/',(req,res)=>{
    res.send('<h1>Hello, World!</h1>');
});

http.listen(3000, ()=>{
    console.log("Listening on 3000.")
});