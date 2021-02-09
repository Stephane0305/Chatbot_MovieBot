'use strict'

const conf = require('../config');
const crypto = require('crypto');
const request = require('request');
const apiVersion = 'V6.0';

class FBeamer{
	constructor({pageAccessToken, VerifyToken, appSecret}){
		this.pageAccessToken = pageAccessToken;
		this.VerifyToken = VerifyToken;
		this.appSecret = appSecret;
	}

	registerHook(req, res) {
		const params = req.query;
		const mode = params['hub.mode'],
		token = params['hub.verify_token'],
		challenge = params['hub.challenge'];
		try {
			if((mode === 'subscribe') && (token === this.VerifyToken))
			{
				console.log("webhook is registered");
				return res.send(challenge);
			}
			else
			{
				throw "Could not register webhook!";
				return res.sendStatus(400);
			}
		}	catch(e) {
			console.log(e);
		}
	}

	verifySignature(req, res, buf) {
		return (req, res, buf) => {
			if(req.method === 'POST') {
				try {
					let signature = req.headers['x-hub-signature'].substr(5);
					let hash = crypto.createHmac('sha1', this.appSecret).update(buf, 'utf-8').digest('hex');
					if(signature != hash)
					{
						throw 'Error verifying signature';
					}
				}	catch(e) {
					console.log(e);
				}
			}
		}
	}

	messageHandler(obj) {
		let sender = obj.sender.id;
		let message = obj.message;
		if(message.text){
			let obj = {
				sender,
				type: 'text',
				content : message.text
			}
			return obj;
		}
	}

	incoming(req, res, cb) {
		res.sendStatus(200);

		if(req.body.object === 'page' && req.body.entry) {
			let data = req.body;
			const messageObj = data.entry;
      		if (!messageObj[0].messaging)
      		{
      			console.log("Error message");
      		}
      		else
      		{
      			for(var i = 0; i < messageObj[0].messaging.length; i++)
      			{
      				return this.messageHandler(messageObj[0].messaging[i]);
      			}
      		} 
		}
	}

	sendMessage(payload) {
		return new Promise((resolve, reject) => {
			request({
				uri: 'https://graph.facebook.com/${apiVersion}/me/messages',
				qs:{
					access_token : this.pageAccessToken
				},
				method: 'POST',
				json: payload
			}, 		(error, response, body) => {
				if(!error && response.statusCode === 200){
					resolve({
						mid: body.message_id
					});
				} else {
					reject(error);
				}
			})
		})
	}

	txt(id, text, messaging_type = 'RESPONSE') {
		let obj = {
			messaging_type,
			recipient:{
				id
			},
			message: {
				text
			}
		}
		console.log(obj);
		return this.sendMessage(obj);
	}
}

module.exports = FBeamer;