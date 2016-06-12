var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


// API End Point - added by Stefan

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            if (text === 'hi') {
                sendGenericMessage(sender)
                continue
            }
            sendTextMessage(sender, "parrot: " + text.substring(0, 200))
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})

var token = "EAALFxLoH4doBAExcBwVj0WKZAFCpi3nfLMZAqtj5Jc7IVpUt109aeMZCZBm7SGHXmHmZCg35SuiWg2MfibN1PVRw6ECZAg5VF3yK3u22iqZBbEk63E0pmGZBQq8FFD7xblm8hv2aocAflcXlJqwcUzgSXRpy3Dsz34ScVUx6i82e7wZDZD"
token = "EAAHgEhQRWMgBABd02OxzenaGoUgZCPRZB6z4PWsccWHq7VZBvL5WjmiE4ZCr9SYJRZA0s9gejXPI7s02krQjPZAZB1GQZBT1iV18bKVUZBqFbxP23BcpMZCH0SYJQX0EK23RruR6FCjZArIVNaiUu6BwxLc866BV0L0fVRIZArVLdqIjAQZDZD"

// function to echo back messages - added by Stefan

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}


// Send an test message back as two cards.

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Meditation",
                    "subtitle": "Increase Happiness one Thankful thought at at time",
                    "image_url": "http://lifescapesolutions.com/wp-content/uploads/2013/04/mediate.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.facebook.com/AhaMomentLabs/videos/1745322282350399/",
                        "title": "10 Min Guided Meditation"
                    }, {
                        "type": "web_url",
                        "url": "https://youtu.be/M7KRgluYeps?list=PLprF3hToBtOAhYTzTJC88E8WB5L2JFQiS",
                        "title": "15 Min Guided Mediation"
                    },{
                        "type": "web_url",
                        "url": "https://youtu.be/eKuGiZ0rL-0?list=PLprF3hToBtOAhYTzTJC88E8WB5L2JFQiS",
                        "title": "Sounds of Nature"
                    }],
                }, {
                    "title": "Life's Meaning & Purpose",
                    "subtitle": "Aking the Deep Questions",
                    "image_url": "http://www.likable.info/img/m/e/meditation-of-woman-amazing-gif.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Meaing if Life",
                        "payload": "Perhaps life has no meaning. If it did, than that meaning would be more valuable than life itself!",
                    },{
                        "type": "postback",
                        "title": "Death",
                        "payload": "Fear of Death is Absurd",
                    }, {
                        "type": "postback",
                        "title": "Enlightenment",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                },  {
                    "title": "Life's Meaning & Purpose",
                    "subtitle": "Aking the Deep Questions",
                    "image_url": "http://www.likable.info/img/m/e/meditation-of-woman-amazing-gif.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Meaing if Life",
                        "payload": "Perhaps life has no meaning. If it did, than that meaning would be more valuable than life itself!",
                    },{
                        "type": "postback",
                        "title": "Death",
                        "payload": "Fear of Death is Absurd",
                    }, {
                        "type": "postback",
                        "title": "Enlightenment",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]  
            } 
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

