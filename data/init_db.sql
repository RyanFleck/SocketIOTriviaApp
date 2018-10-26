CREATE TABLE IF NOT EXISTS messages(
    username VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    message VARCHAR(300) NOT NULL,
    time TIMESTAMP );

CREATE TABLE IF NOT EXISTS highscores(
    username VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    score INT NOT NULL,
    time TIMESTAMP );