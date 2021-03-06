var diagnose = require('./diagnose.js')
var request = require('request')
var dateformat = require('dateformat')
var config = require('./config.js')

var bot = function(req, res)
{
	this.req = req
	this.res = res
	this.pgClient = require('./db.js')
	this.token = config.token
}

bot.prototype = 
{
    webhook : function() {
		messaging_events = this.req.body.entry[0].messaging
		for (i = 0; i < messaging_events.length; i++) {
			event = this.req.body.entry[0].messaging[i]
			
			if(
				((typeof(event.message) != "undefined") && event.message.is_echo == true)
				||
				event.read
			)
			{
				continue;
			}
			
			sender = event.sender.id
			
			if (event.postback) {
				if(event.postback.payload == 'getstarted')
				{
					event.postback.payload = 'payload:more::getStarted'
				}
				if(event.postback.payload == 'USER_DEFINED_PAYLOAD')
				{
					event.postback.payload = 'payload:more::getStarted'
				}
				var matches = event.postback.payload.match(/payload:(\w*?)::(\w*?)$/)
				if(matches)
				{
					event.postback.payload = '{"controller": "' + matches[1] + '", "method": "' + matches[2] + '"}'
				}
				
				event.postback.payload = JSON.parse(event.postback.payload)
				this.getController(event.postback.payload.controller, event)[event.postback.payload.method]();
				continue
			}
						
			if (event.message && event.message.text) {
				if(event.message.text=='/timezone')
				{
					this.getController('diagnose', event).prompt(event.message.text)
				}
				else if(event.message.text.toLowerCase() == 'get started')
				{
					this.getController('more', event).getStarted();
				}
				else
				{
					var that = this
					that.getModel('user').getInputMode(sender, function(mode)
						{
							if(!mode)
							{
								mode = 'reminder.acceptMessage';
							}
							var parts = mode.split('.');
							var controller_name = parts[0]
							var controller_method = parts[1]
							if(typeof(that.getController(controller_name, event)[controller_method]) != 'function')
							{
								that.sendTextMessage(sender, "I do not understand, I'm just a robot :\\")
								that.getModel('user').expectInput(sender, '')
							}
							else
							{
								if(typeof(event.message) == 'undefined')
								{
									console.log('debugging event::', event);
								}
								that.getController(controller_name, event)[controller_method](event.message.text);
							}
						}
					)
				}
			}
			else
			{
				// delivery receipt
				//console.log(event)
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
		var file = './' + _controller.replace(/\W/, '') + '.js'
		var controller = require(file)
		return new controller(this, event)
	}
	,
	
	getModel: function(model)
	{
		var file = './models/' + model.replace(/[\W]/, '') + '.js';
		var model = require(file)
		return new model(this)
	}
	,
		
	test: function()
	{
		this.webhook()
		
	}
	,
	
	
	sendTextMessage : function(sender, text, _callback) {
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
			else 
			{
				if(typeof(_callback) == 'function')
				{
					_callback(response.body);
				}
			}
		})
	}
	,
	
	
	
	
	sendReminders: function()
	{
		var that = this;
		that.pgClient.query('SELECT notes.*, topics.topic FROM "notes" LEFT JOIN topics ON topics.note_id = notes.id WHERE notes.notified = FALSE AND notes.reminder_at IS NOT NULL AND notes.reminder_at <= NOW()').on('row', function(row) 
			{
				that.sendTextMessage(row.user_id, 'You asked me to remind you:', function(body) {
						that.getController('search', {'sender': {'id': row.user_id}}).details(row.id)
						that.pgClient.query('UPDATE notes SET notified = TRUE WHERE id = ' + row.id)
					}
				)
			}
		)
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
	
	sendImageMessage: function(sender, url, callback) {
		messageData = {
			"attachment": {
				"type": "image",
				"payload": {
					"url": url
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
				return console.log('Error sending messages: ', error)
			} else if (response.body.error) {
				return console.log('Error: ', response.body.error)
			}
			if(typeof(callback) == 'function') 
			{
				callback(response.body);
			}
		})
	}
	,
	
	sendButtonsMessage: function(sender, text, buttons, callback) {
		messageData = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type":"button",
					"text": text,
					"buttons": buttons
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
				return console.log('Error sending messages: ', error)
			} else if (response.body.error) {
				return console.log('Error: ', response.body.error)
			}
			if(typeof(callback) == 'function') 
			{
				callback(response.body);
			}
		})
	}
	
	
	,
	getProfile: function(user_id, callback)
	{
		var that = this;
		that.pgClient.query('SELECT * FROM "user_data" WHERE user_id = $1', [user_id]).on('row', callback);
		
		return;
		
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
	
	
	,
	url: function(path)
	{
		var that = this
		
		switch(path)
		{
			case 'timezone':
				if (this.req.method == 'GET')
				{

					require('fs').readFile(__dirname + '/template/timezone.html', 'utf8', function (err, data)
						{
							if(err)
							{
								return console.log(err)
							}
							data = data.replace('{{token}}', that.req.query['token']);
							that.res.send(data)
						}
					)
				}
				else
				{
					var token = that.req.body.token;
					var offset = that.req.body.offset;
					var timezone = offset	//require('./timeFormat.js').offsetToTimezone(offset)
					
					that.getModel('user').updateTimezone(token, timezone, function(err, row)
						{
							if(err)
							{
								console.log(err);
								that.res.send('Error occured, but we have been notified!')
							}
							else
							{
								that.sendTextMessage(row.user_id, 'Got it! Now all your reminders will be on time.\nRemember to update when Traveling :)') /*+ require('./timeFormat.js').offsetToTimezone(timezone))*/;
								require('fs').readFile(__dirname + '/template/timezone-set.html', 'utf8', function (err, data)
									{
										if(err)
										{
											that.res.send('Error occured, but we have been notified.')
											return console.log(err)
										}
										else
										{
											that.res.send(data)
										}
									}
								)
							}
						}
					)
				}
		}
	}
}


module.exports = bot