const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function generateQuestion() {
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    let question = `${num1} ${operator} ${num2}`;
    let answer;

    switch (operator) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            answer = num1 - num2;
            break;
        case '*':
            answer = num1 * num2;
            break;
        case '/':
            answer = (num1 / num2).toFixed(2);  // division to 2 decimal points
            break;
    }

    return { question, answer };
}

let players = [];
let scores = [0, 0];

io.on('connection', (socket) => {
    // Add player to the game
    if (players.length < 2) {
        players.push(socket);
        socket.emit('message', 'Waiting for another player to join...');
    }

    if (players.length === 2) {
        // Send the first question to both players
        const { question, answer } = generateQuestion();
        io.emit('newQuestion', question);

        // Listen for players' answers
        socket.on('answer', (msg) => {
            if (parseFloat(msg) === answer) {
                if (players.indexOf(socket) === 0) {
                    scores[0]++;
                } else {
                    scores[1]++;
                }
                io.emit('scoreUpdate', scores);
                if (scores[0] >= 10 || scores[1] >= 10) {
                    io.emit('endGame', `Player ${scores[0] >= 10 ? 1 : 2} wins!`);
                    scores = [0, 0]; // Reset scores
                    io.emit('scoreUpdate', scores);
                }
            }
        });
    }
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

