/*
libaries for api used:
npm install body-parser cors express helmet morgan

other libaries used:
node-binance-api
https://www.npmjs.com/package/node-binance-api
npm install -s node-binance-api
*/

// ./src/index.js

// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// defining the Express app
const app = express();


// defining an array to work as the database (temporary solution)
const ads = [
  {title: 'Hello, world (again)!'}
];

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

//------------------------------------------------------------------------------

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: '<key>',
  APISECRET: '<secret>'
});

function convertCryptoToUsdt(amountCrypto, cryptoPrice){
	return amountCrypto * cryptoPrice;
}

function convertUsdtToCrypto(amountUsdt, cryptoPrice){
	return amountUsdt / cryptoPrice;
}

class OrderBook {
	constructor(symbol, bookObj) {
		this.symbol = symbol;
		this.bookObj = bookObj;
	}
	
	static async getDepth(symbol){
		var async_result = binance.futuresDepth(symbol);
		return async_result;
	}
	
	acceptTopOffer(side, userObj, feesPercent = 0.04){
		if (side == 'long'){
			var lowestSellingOffer = this.bookObj['asks'][0];
			var lowestSellingOfferPrice = parseFloat(lowestSellingOffer[0]);
			var lowestSellingOfferSize = parseFloat(lowestSellingOffer[1]);
			var sizeAbleToBuy = convertUsdtToCrypto(userObj.avaliableUSDT, lowestSellingOfferPrice);
			if(sizeAbleToBuy >= lowestSellingOfferSize){
				userObj.posSize += lowestSellingOfferSize;
				delete this.bookObj['asks'].splice(0,1);
				let acceptOfferCostUSDT = lowestSellingOfferSize * lowestSellingOfferPrice;
				userObj.avaliableUSDT -= acceptOfferCostUSDT;
				userObj.unrealizedPnlUSDT -= acceptOfferCostUSDT * (feesPercent/100);
			}else{
				userObj.posSize += sizeAbleToBuy;
				this.bookObj['asks'][0][1] -= sizeAbleToBuy;  //size of offer
				let acceptOfferCostUSDT = sizeAbleToBuy * lowestSellingOfferPrice;
				userObj.avaliableUSDT -= acceptOfferCostUSDT;
				userObj.unrealizedPnlUSDT -= acceptOfferCostUSDT * (feesPercent/100);
			}
		}else if(side == 'short'){
			var highestBuyingOffer = this.bookObj['bids'][0];
			var highestBuyingOfferPrice = parseFloat(highestBuyingOffer[0]);
			var highestBuyingOfferSize = parseFloat(highestBuyingOffer[1]);
			var sizeAbleToSell = userObj.posSize;
			if(sizeAbleToSell >= highestBuyingOfferSize){
				userObj.posSize -= highestBuyingOfferSize;
				delete this.bookObj['bids'].splice(0,1);
				let acceptOfferCostUSDT = highestBuyingOfferSize * highestBuyingOfferPrice;
				userObj.avaliableUSDT += acceptOfferCostUSDT;
				userObj.unrealizedPnlUSDT -= acceptOfferCostUSDT * (feesPercent/100);
			}else{
				userObj.posSize -= sizeAbleToSell;
				this.bookObj['bids'][0][1] -= sizeAbleToSell;  //size of offer
				let acceptOfferCostUSDT = sizeAbleToSell * highestBuyingOfferPrice;
				userObj.avaliableUSDT += acceptOfferCostUSDT;
				userObj.unrealizedPnlUSDT -= acceptOfferCostUSDT * (feesPercent/100);
			}
		}
	}
	
	calculateMidPrice(){
		var lowestSellingOffer = this.bookObj['asks'][0];
		var lowestSellingOfferPrice = parseFloat(lowestSellingOffer[0]);
		var highestBuyingOffer = this.bookObj['bids'][0];
		var highestBuyingOfferPrice = parseFloat(highestBuyingOffer[0]);
		var midPrice = (lowestSellingOfferPrice + highestBuyingOfferPrice)/2;
		return midPrice;
	}
}

class User {
	constructor(avaliableUSDT, posSize){
		this.avaliableUSDT = avaliableUSDT;
		this.posSize = posSize;
		this.unrealizedPnlUSDT = 0;
	}
}

async function calcFuturesActualFeePercent(mode, side, symbol, oriBalanceUsdt, feesPercent = 0.04){
	if (mode == 'instant'){
		//not implemented
	}
	let bookObj = await OrderBook.getDepth(symbol).then(function(val){
		return val;
	});
	
	let orderBook = new OrderBook(symbol, bookObj);
	
	let midPrice = orderBook.calculateMidPrice();
	
	console.log('symbol: ', symbol);
	console.log(bookObj);
	console.log('Mid Price: ', midPrice);
	
	if(side == 'long'){
		var user = new User(avaliableUSDT = oriBalanceUsdt, posSize = 0);
		while(user.avaliableUSDT > 0){
			orderBook.acceptTopOffer(side = 'long', userObj = user, feesPercent = feesPercent);
		}
	}else if(side == 'short'){
		var oriBalanceCrypto = convertUsdtToCrypto(oriBalanceUsdt, midPrice);
		var user = new User(avaliableUSDT = 0, posSize = oriBalanceCrypto);
		while(user.posSize > 0){
			orderBook.acceptTopOffer(side = 'short', userObj = user, feesPercent = feesPercent);
		}
	}
	
	console.log(user);
		
	if(side == 'long'){
		var theoreticalFinalUSDT =  convertCryptoToUsdt(user.posSize, midPrice) + user.unrealizedPnlUSDT;
		
	}else if(side == 'short'){
		var theoreticalFinalUSDT =  user.avaliableUSDT + user.unrealizedPnlUSDT;
	}
	
	var percentLoss = (theoreticalFinalUSDT - oriBalanceUsdt)*100/oriBalanceUsdt;
	
	console.log('theoreticalFinalUSDT: ', theoreticalFinalUSDT);
	console.log('percentLoss: ', percentLoss);
	
	return percentLoss;
}

async function getSymbols(){
	let exhInfo = await binance.futuresExchangeInfo().then(function(val){
		return val;
	});
	//console.info(exhInfo);
	symbol_a = [];
	for(i = 0; i < exhInfo.symbols.length; i++){
		symbol_a.push(exhInfo.symbols[i].symbol);
	}
	return symbol_a;
}

// defining an endpoint to return all ads
app.get('/', (req, res) => {
  res.send(ads);
});

app.get('/api/getSymbols', async (req, res) => {
  let returnMsg = await getSymbols().then(function(val){
		return val;
	});
  res.send({symbols: returnMsg});
});

app.get('/api/calcFuturesActualFeePercent', async (req, res) => {
	let mode = req.query.mode;
	let side = req.query.side;
	let symbol = req.query.symbol;
	let oriBalanceUsdt = req.query.oriBalanceUsdt;
	if (req.query.feesPercent == 'undefined'){ // optional query
		var feesPercent = 0.04;
	}else{
		var feesPercent = req.query.feesPercent;
	}
	let returnMsg = await calcFuturesActualFeePercent(mode, side, symbol, oriBalanceUsdt, feesPercent).then(function(val){
		return val;
	});
  res.send({percentLoss: returnMsg});
});

// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});