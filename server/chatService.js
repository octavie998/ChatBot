const config      = require('config');
const request     = require('request');
const userService = require('./userService');
const weatherService = require('../server/weatherService');
const parser      = require('json-parser');
const WeatherData = require('../server/model/weatherData');

// Get the config const
const PAGE_ACCESS_TOKEN = config.get('pageAccessToken');
const VALIDATION_TOKEN = config.get('verifyToken');

var TrouverNombre = Math.floor(Math.random() * 11);

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (userService.isUserKnown(senderID) == false) {
        userService.addUser(senderID, {
            id: senderID,
            createdAt: timeOfMessage,
            status: 'chat',
            nbMessagesSend: 1
        });
        if (messageText) {
            switch (messageText) {
                case 'Coucou':
                case 'coucou':
                case "hello":
                case "Hello" :
                case "Yo":
                case "yo":
                case "Bonjour":
                case "bonjour":
                case "Salut":
                case "salut":
                    sendTextMessage(senderID, messageText + " toi");
                    break;
                default:
                    sendTextMessage(senderID, "Bienvenue ! ");
                    break;
            }
        } else if (messageAttachments) {
            sendTextMessage(senderID, "Message with attachment received");
        }
        sendTextMessage(senderID, "Je te propose un jeu." +
            "Je vais prendre un nombre au hasard entre 0 et 10, et tu vas deviner. Je te dirai simplement PLUS ou MOINS. OK ?");
    } else {
        var user = userService.getUser(senderID);

        if (user.status == 'chat') {
            if (hasWord(messageText, 'météo') || hasWord(messageText, 'Météo')) {
                sendTextMessage(senderID, "De quelle ville voulez vous la météo ?");
                userService.changeUserStatus(senderID, 'météo');
            } else if (hasWord(messageText, 'jeu') || hasWord(messageText, 'Jeu')) {
                sendTextMessage(senderID, "Donne moi un nombre entre 0 et 10");
                userService.changeUserStatus(senderID, 'jeu');
            } else {
                sendTextMessage(senderID, 'Envoie météo ou jeu');
            }
        } else if (user.status == 'jeu') {
            if (messageText < TrouverNombre) {
                sendTextMessage(senderID, "C'est plus !");
            } else if (messageText > TrouverNombre) {
                sendTextMessage(senderID, "C'est moins !");
            } else if (messageText == TrouverNombre) {
                sendTextMessage(senderID, "Bravo ! c'est pile ça !)");
                userService.changeUserStatus(senderID, 'chat');
            } else {
                sendTextMessage(senderID, "On a dit un nombre ! Truglion");
            }
        } else if (user.status == 'météo') {
            weatherService.getGeolocalisation(messageText)
                .then(function(body) {
                    var response = parser.parse(body).results;

                    if (response.length <= 0) {
                        sendTextMessage(senderID, 'Je ne connais pas ta ville');
                    } else {
                        var location = response[0].geometry.location;
                        var longitude = location.lng;
                        var latitude = location.lat;

                        sendTextMessage(senderID, 'Voici la météo');

                        weatherService.getWeatherForecast(latitude, longitude)
                            .then(function (body) {
                                var weatherData = new WeatherData(body);
                                var carousel = [];

                                weatherData.forecast.forEach(function(forecast) {
                                    var day = {
                                        title: forecast.display.date,
                                        subtitle: forecast.weather.description + '\n'
                                            + 'Max :' + forecast.temp.max + '°C\n'
                                            + 'Min :' + forecast.temp.min + '°C',
                                        image_url: forecast.weather.image,
                                        buttons: [
                                            {
                                                type: 'web_url',
                                                url: 'http://maps.google.com/maps?z=12&t=m&q=loc:' + latitude + '+' + longitude,
                                                title: 'Open Google Map'
                                            }
                                        ]
                                    };

                                    carousel.push(day);
                                });

                                sendCarouselReply(senderID, carousel);
                            });
                    }
                })
                .catch(function(err) {
                    // Do nothing
                });

            // sendTextMessage(senderID, "Il fait beau à l'ile de Ré");

            userService.changeUserStatus(senderID, 'chat');
        }
        userService.incrementUser(senderID);
    }
}

function hasWord(messageText, word) {
    var arrayOfWord = messageText.split(' ');

    return (arrayOfWord.indexOf(word) !== -1);
}

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function authenticate(req) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        return true;
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        return false;
    }
}

function sendCarouselReply(recipientId, carousel) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: carousel
                }
            }
        }
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

module.exports = {
    authenticate: authenticate,
    receivedMessage: receivedMessage,
    sendTextMessage: sendTextMessage,
    sendCarouselReply: sendCarouselReply
};
