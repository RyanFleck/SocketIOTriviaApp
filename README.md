# SocketIOTriviaApp
Experiment with Socket.IO to create a basic trivia app shell.

This app automatically deploys to *Heroku* at <https://sio-trivia.herokuapp.com/>

## Site Structure

Apart from the main page, the site has a few locked pages for management of the comments and database:

```
Index
|_ EnterName (Entry Point)
|
|_ Manage
| |_ Moderate Chat
| \_ Reset DB
|
\_ Trivia
  \_ Generated Question Pages
```