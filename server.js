const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the game page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/game.html');
});

// Function to generate random arithmetic questions
function generateQuestion() {
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1, num2, question, answer;

    if (operator === '/') {
        // Division: Only numbers between 10 and 800, and they must be divisible
        while (true) {
            num1 = Math.floor(Math.random() * (800 - 10 + 1)) + 10;
            num2 = Math.floor(Math.random() * (800 - 10 + 1)) + 10;
            if (num1 % num2 === 0) {
                answer = num1 / num2;
                question = `${num1} ÷ ${num2}`;
                break;
            }
        }
    } else {
        // Addition, subtraction, and multiplication: Numbers between 1 and 50
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;

        switch (operator) {
            case '+':
                answer = num1 + num2;
                question = `${num1} + ${num2}`;
                break;
            case '-':
                answer = num1 - num2;
                question = `${num1} - ${num2}`;
                break;
            case '*':
                answer = num1 * num2;
                question = `${num1} × ${num2}`;
                break;
        }
    }

    return { question, answer };
}

let players = [];
let scores = [0, 0];

io.on('connection', (socket) => {
    io.on("connection", (socket) => {
      socket.emit("hello", "world");
    });
    if (players.length < 2) {
        players.push(socket);
        socket.emit('message', 'Waiting for another player to join...');
    }

    if (players.length === 2) {
        const { question, answer } = generateQuestion();
        io.emit('newQuestion', question);

        socket.on('answer', (msg) => {
            if (parseFloat(msg) === answer) {
                const playerIndex = players.indexOf(socket);
                scores[playerIndex]++;
                io.emit('scoreUpdate', scores);

                if (scores[playerIndex] >= 10) {
                    io.emit('endGame', `Player ${playerIndex + 1} wins!`);
                    scores = [0, 0]; // Reset scores
                    io.emit('scoreUpdate', scores);
                } else {
                    // Generate new question after a correct answer
                    const newQuestion = generateQuestion();
                    io.emit('newQuestion', newQuestion.question);
                }
            }
        });
    }

    socket.on('disconnect', () => {
        players = players.filter(p => p !== socket);
        if (players.length < 2) {
            io.emit('message', 'Waiting for another player to join...');
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
