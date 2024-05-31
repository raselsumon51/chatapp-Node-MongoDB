const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const MongoStore = require('connect-mongo');


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
require("dotenv").config();

// const port = process.env.PORT; // Use environment variable for port
const DATABASE_URL = process.env.DATABASE_URL;

// Database connection
mongoose.connect('mongodb+srv://raselsumon51:enPAmPa3oRxTsOCW@cluster0.nngte0p.mongodb.net/userchat?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if unable to connect to MongoDB
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'ndsndsnbsdbbsdsbdbsdb',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl: DATABASE_URL,
      ttl: 14 * 24 * 60 * 60 // 14 days
    })
}));

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);
app.use('/', chatRoutes);

// Socket.io integration
const users = {};

io.on('connection', socket => {
    console.log('A user connected');

    // Event handler for when a new user joins
    socket.on('join', username => {
        users[username] = socket.id;
        console.log(`${username} joined the chat`);
    });

    // Event handler for receiving messages
    socket.on('chat message', async data => {
        const { sender, receiver, message } = data;
        console.log(Message);

        try {
            // Save message to the database
            const newMessage = new Message({ sender, receiver, message });
            await newMessage.save();

            // Emit the message to the receiver if online
            const receiverSocket = users[receiver];
            if (receiverSocket) {
                io.to(receiverSocket).emit('private message', { sender, message });
            }
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Failed to send message' }); // Emit error to the sender
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const disconnectedUser = Object.keys(users).find(key => users[key] === socket.id);
        if (disconnectedUser) {
            delete users[disconnectedUser];
        }
    });
});

// Start the server
const PORT = process.env.port || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
