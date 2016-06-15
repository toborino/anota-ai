var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var bot = require('./app/bot.js')
app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

app.get('/', function (req, res) {
	var pgClient = require('./app/db.js');
//	var query = pgClient.query('CREATE TABLE notes(id SERIAL PRIMARY KEY, user_id, text VARCHAR(250) not null, time, notified BOOLEAN, created_at)');
	var exec = require('child_process').exec;
	var cmd = 'php -r "echo date(\'e\');"';

	exec(cmd, function(error, stdout, stderr) {
		console.log(error, stdout, stderr);
		res.send(error, stdout, stderr);
		// command output is in stdout
	});
    //res.send('Hello world, I am a chat bot')
})


app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})



var token = "EAALFxLoH4doBAExcBwVj0WKZAFCpi3nfLMZAqtj5Jc7IVpUt109aeMZCZBm7SGHXmHmZCg35SuiWg2MfibN1PVRw6ECZAg5VF3yK3u22iqZBbEk63E0pmGZBQq8FFD7xblm8hv2aocAflcXlJqwcUzgSXRpy3Dsz34ScVUx6i82e7wZDZD"
token = 'EAAHgEhQRWMgBAGqa7QG4l8wsKEeK6ZC3SZAGuLpKuMRbCcWl27sDiU6dc4ljalrCvN9I4YYzbZAUwgxi6AhvS0Qhsu6Pq0sGSJb6dXHUZCfZCqN4IfKSXcrn5qHc55eYFAtfHZBjtZA15uiI5iNduo9YJCA0kAxMRrutgWOUSInogZDZD'


app.post('/webhook/', function(req, res) {
	var _bot = new bot(req, res)
	_bot.setToken(token);
	_bot.webhook();
	try
	{
		
	}
	catch(ex)
	{
		
	}
})

