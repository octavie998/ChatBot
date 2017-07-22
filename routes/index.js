const express = require('express');
const app     = express.Router();
const config  = require('config');
const request = require('request');

// Get the config const
const PAGE_ACCESS_TOKEN = config.get('pageAccessToken');
const VERIFY_TOKEN      = config.get('verifyToken');

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VERIFY_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.post('/webhook', function(req, res) {
    console.log('message received');
    res.sendStatus(201);
});

module.exports = app;
