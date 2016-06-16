var reminder = require('./reminder.js')
var request = require('request')
var dateformat = require('dateformat')

var bot = function(req, res)
{
	this.req = req
	this.res = res
	this.pgClient = require('./db.js')
}

bot.prototype = 
{
    webhook : function() {
		messaging_events = this.req.body.entry[0].messaging
		for (i = 0; i < messaging_events.length; i++) {
			event = this.req.body.entry[0].messaging[i]
			sender = event.sender.id
			if (event.postback) {
				//text = JSON.stringify(event.postback)
				console.log(event.postback.payload)
				event.postback.payload = JSON.parse(event.postback.payload)
				this.getController(event.postback.payload.controller, event)[event.postback.payload.method]();
				continue
			}
			
			if (event.message && event.message.text) {
				/*
				text = event.message.text
				if (text === 'hi') {
					sendGenericMessage(sender)
					continue
				}
				sendTextMessage(sender, "parrot: " + text.substring(0, 200))
				*/
				this.getController('reminder', event).prompt(event.message.text)
			}
			else
			{
				console.log(event)
			}
			
		}
		if(!this.res.headerSent)
		{
			this.res.send('ok')
		}
		
	}
	
	,
	
	getController: function(_controller, event)
	{
		switch(_controller)
		{
			case 'reminder':
				return new reminder(this, event);
		}
		//sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
	}
	,
	
	test: function()
	{
		this.webhook()
		
	}
	,
	
	
	sendTextMessage : function(sender, text) {
		messageData = {
			text:text
		}
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: {access_token:this.token},
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
	,
	
	
	
	
	sendReminders: function()
	{
		var that = this;
		that.pgClient.query('SELECT * FROM "notes" WHERE notified = FALSE AND reminder_at IS NOT NULL AND reminder_at <= "' + dateformat(new Date(), 'yyyy-mm-dd H:MM:00') + '"').on('row', function(row) {
			console.log('reminding: ' , row);
			that.sendTextMessage(row.user_id, row.text);
			that.pgClient.query('UPDATE "notes" SET notified = TRUE WHERE id = ' + row.id);
		});
	}
	
	,
	
	
	
	sendGenericMessage: function(sender, elements) {
		messageData = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": elements
				} 
			}
		}
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: {access_token:this.token},
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

	, 
	
	setToken: function(token)
	{
		this.token = token
	}
	
	
	,
	getProfile: function(user_id, callback)
	{
		request({
			url: 'https://graph.facebook.com/v2.6/' + user_id,
			qs: {'fields': 'first_name,last_name,profile_pic,locale,timezone,gender', 'access_token':this.token},
			method: 'GET',
		}, function(error, response, body) {
			if (error) {
				console.log('Error fetching profile #: ' + user_id, error)
			} else if (response.body.error) {
				console.log('Error fetching profile #: ' + user_id, response.body.error)
			}
			else {
				try {
					callback(JSON.parse(body));
				}
				catch(ex)
				{
					console.log('Error decoding profile', body)
				}
				
			}
		})
	}
	
}


module.exports = bot