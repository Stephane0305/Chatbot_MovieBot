'use strict';
//Bien relancer ngrok http 3000 pour remettre le bon URL de rappel
const express = require('express');
const config = require('./config');
const FBeamer = require('./fbeamer');
const bodyparser = require('body-parser');

const server = express();
const PORT = process.env.PORT || 3000;

const f = new FBeamer(config.FB);

server.get('/', (req, res) => f.registerHook(req, res));
server.listen(PORT, () => console.log(`The bot server is running on port ${PORT}`));
server.post('/', bodyparser.json({
	verify: f.verifySignature.call(f)
}));
server.post('/', (req, res, data) => {
	return f.incoming(req, res, data => {
		const userData = FB.messageHandler(data);
    	FB.txt(userData.sender, "Hello!", "RESPONSE");
	});
});