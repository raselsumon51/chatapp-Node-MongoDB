const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// // Chat page route
// router.get('/chat', async (req, res) => {
//     // console.log(req.session)
//     const chat = true;
//     const receiver =""
//     if (!req.session.loggedIn) {
//         return res.redirect('/');
//     }

//     try {
//         const messages = await Message.find({
//             $or: [{ sender: req.session.username }, { receiver: req.session.username }]
//         }).sort('timestamp').exec();
//         const users = await User.find({ username: { $ne: req.session.username } }, 'username').exec();
//         res.render('chat1', { username: req.session.username, users, messages, receiver, chat });
//     } catch (err) {
//         res.status(500).send('Internal server error');
//     }
// });

router.get('/chat/:username', async (req, res) => {
    const user = req.params.username;
    const chat = false;

try {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }

    // Check if req.session.username and user are defined
    if (!req.session.username || !user) {
        return res.status(400).send('Bad request');
    }

    const messages = await Message.find({
        $or: [
            { sender: req.session.username, receiver: user },
            { sender: user, receiver: req.session.username }
        ]
    }).sort('timestamp').exec();

    const users = await User.find({ username: { $ne: req.session.username } }, 'username').exec();

    console.log(messages);

    res.render('chat1', { username: req.session.username, users, messages, receiver: user,chat });
} catch (err) {
    console.error(err); // Log the error for debugging purposes
    res.status(500).send(`Internal server error: ${err.message}`);
}

});

module.exports = router;
