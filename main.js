// the hello world program
/*
libaries used:
node-binance-api
https://www.npmjs.com/package/node-binance-api
npm install -s node-binance-api

*/


const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: '<key>',
  APISECRET: '<secret>'
});


async function getDepth(symbol){
	var x  = await binance.futuresDepth( symbol );
	return x;
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



function convertCryptoToUsdt(amountCrypto, cryptoPrice){
	return amountCrypto * cryptoPrice;
}

function convertUsdtToCrypto(amountUsdt, cryptoPrice){
	return amountUsdt / cryptoPrice;
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
	
}


calcFuturesActualFeePercent('instant', 'long', 'XMRUSDT', 30000, 0.04);
//calcFuturesActualFeePercent('instant', 'short', 'LTCUSDT', 30000, 0.04);