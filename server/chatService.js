const config      = require('config');
const request     = require('request');
const userService = require('./userService');

// Get the config const
const PAGE_ACCESS_TOKEN = config.get('pageAccessToken');
const VALIDATION_TOKEN = config.get('verifyToken');
var nombre = 0;

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
            status: 'chat'
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
                    sendTextMessage(senderID, "Bienvenue ! Je te propose de te raconter une blague. Ca te tente ? Dis moi oui ou non");
                    break;
            }
        } else if (messageAttachments) {
            sendTextMessage(senderID, "Message with attachment received");
        }
    } else {
        sendTextMessage(senderID, "On se connait déjà, je suis content de te revoir ! Je te propoose de te raconter une blague. Ca te tente ? Dis moi oui ou non");
    }
    nombre = nombre - 1;
    sendTextMessage(senderID, nombre);
    //if (messageText) {
    //        switch (messageText) {
     //           case "oui":
     //               sendTextMessage(senderID, "C'est 2 grains de sable qui arrivent à la plage: Putain, c'est blindé aujourd'hui...");
     //               break;
     //           case "non":
     //               sendTextMessage(senderID, "Dommage pour toi mon coco");
     //               break;
      //          default:
     //               sendTextMessage(senderID, "Je n'ai pas compris la réponse. Pourtant c'était pas compliqué : oui ou non. Tu as une deuxième chance. Ca te tente une blague ?");
     //       }
      //  }
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
