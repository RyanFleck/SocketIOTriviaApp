const app = require('express')();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;

app.get('/',(req,res)=>{
    res.send('<h1>Hello, World!</h1>');
});

http.listen(port, ()=>{
    console.log("Listening on "+port)
});