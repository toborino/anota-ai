var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var bot = require('./app/bot.js')
app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// file upload
var busboy = require('connect-busboy')
app.use(busboy())

app.get('/', function (req, res) {
	
})

var timezone = function (req, res) {
	var _bot = new bot(req, res)
	_bot.url('timezone');
}

app.get('/timezone', timezone)

app.post('/timezone', timezone);


app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


app.post('/webhook/', function(req, res) {
	var _bot = new bot(req, res)
	_bot.webhook();
	try
	{
		
	}
	catch(ex)
	{
		
	}
})

