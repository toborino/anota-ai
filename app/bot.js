var reminder = require('./reminder.js')
var request = require('request')

var bot = function(req, res)
{
	this.req = req
	this.res = res
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
				var payload = JSON.parse(event.postback.payload)
				this.getController(payload.controller, event)[payload.method]();
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
				this.res.send('')
				this.res.sendStatus(200)
			}
			
		}
		//res.sendStatus(200)
		
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
	
	
	
	
}


module.exports = bot