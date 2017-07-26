const express     = require('express');
const app         = express.Router();
const config      = require('config');
const request     = require('request');
const chatService = require('../server/chatService');
const weatherService = require('../server/weatherService');
const parser      = require('json-parser');
const WeatherData = require('../server/model/weatherData');

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/webhook', function(req, res) {
    if (chatService.authenticate(req)) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.get('/weather', function(req, res) {
    weatherService.getGeolocalisation('Palaiseau')
        .then(function(body) {
            var location = parser.parse(body).results[0].geometry.location;
            var longitude = location.lng;
            var latitude = location.lat;

            weatherService.getWeatherForecast(latitude, longitude)
                .then(function(body) {
                    var weatherData = new WeatherData(body);

                    res.send(weatherData);
                });
        })
        .catch(function(err) {
            // Do nothing
        })
});

app.post('/webhook', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    chatService.receivedMessage(event);
                } else {
                    console.log("Webhook received unknown event");
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200);
    }
});

module.exports = app;
