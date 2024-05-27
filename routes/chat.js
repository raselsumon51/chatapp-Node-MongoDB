const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Chat page route
router.get('/chat', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }

    try {
        const messages = await Message.find({
            $or: [{ sender: req.session.username }, { receiver: req.session.username }]
        }).sort('timestamp').exec();
        const users = await User.find({}, 'username').exec();
        res.render('chat', { username: req.session.username, users, messages });
    } catch (err) {
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
