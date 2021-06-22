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


async function getDepth(){
	var x  = await binance.futuresDepth( "XMRUSDT" );
	return x;
}

function acceptBuyCryptoOffer(usdtBal, cryptoBal, offerPriceInUsdt, offerCryptoSize, fees_percent){
	var sizeAbleToBuy = usdtBal/offerPriceInUsdt;
	if(sizeAbleToBuy >= offerCryptoSize){
		cryptoBal += offerCryptoSize  * (100-fees_percent)/100;
		usdtBal -= (offerCryptoSize * offerPriceInUsdt);
	}else{
		cryptoBal += sizeAbleToBuy * (100-fees_percent)/100;
		usdtBal = 0;
	}
	return [usdtBal, cryptoBal];
}

function acceptSellCryptoOffer(usdtBal, cryptoBal, offerPriceInUsdt, offerCryptoSize, fees_percent){
	var sizeAbleToSell = cryptoBal;
	if(sizeAbleToSell >= offerCryptoSize){
		cryptoBal -= offerCryptoSize;
		usdtBal += (offerCryptoSize * offerPriceInUsdt) * (100-fees_percent)/100;
	}else{
		cryptoBal = 0;
		usdtBal += sizeAbleToSell * offerPriceInUsdt * (100-fees_percent)/100;
	}
	return [usdtBal, cryptoBal];
}

function buyCryptoFromUsdt(orderBook, usdtBalance){
	var cryptoBalance = 0;
	var i = 0;
	while(usdtBalance > 0){
		var lowestSellingOffer = orderBook['asks'][i];
		var lowestSellingOfferPrice = parseFloat(lowestSellingOffer[0]);
		var lowestSellingOfferSize = parseFloat(lowestSellingOffer[1]);
		[usdtBalance, cryptoBalance] = acceptBuyCryptoOffer(usdtBalance, cryptoBalance, lowestSellingOfferPrice, lowestSellingOfferSize, 0.04);
		i += 1;
	}
	return cryptoBalance;
}

function sellCryptoFromUsdt(orderBook, cryptoBalance){
	var usdtBalance = 0;
	var i = 0;
	while(cryptoBalance > 0){
		var highestBuyingOffer = orderBook['bids'][i];
		var highestBuyingOfferPrice = parseFloat(highestBuyingOffer[0]);
		var highestBuyingOfferSize = parseFloat(highestBuyingOffer[1]);
		[usdtBalance, cryptoBalance] = acceptSellCryptoOffer(usdtBalance, cryptoBalance, highestBuyingOfferPrice, highestBuyingOfferSize, 0.04);
		i += 1;
	}
	return usdtBalance;
}

function convertCryptoToUsdt(amountCrypto, cryptoPrice){
	return amountCrypto * cryptoPrice;
}

function convertUsdtToCrypto(amountUsdt, cryptoPrice){
	return amountUsdt / cryptoPrice;
}

async function main(){
	var orderBook = await getDepth().then(function(val){
		return val;
	});

	console.log('order book: ', orderBook);
	
	var midPrice = (parseFloat(orderBook['bids'][0][0]) + parseFloat(orderBook['asks'][0][0]))/2;
	console.log('midPrice: ', midPrice);
	
	var oriBalanceUsdt = 3000;
	var cryptoBalance = buyCryptoFromUsdt(orderBook, oriBalanceUsdt);
	finalBalUsdt = convertCryptoToUsdt(cryptoBalance, midPrice);
	console.log('cryptoBalance: ', cryptoBalance);
	
	var percentLoss = (finalBalUsdt - oriBalanceUsdt)*100/finalBalUsdt;
	console.log('percentLoss: ', percentLoss);
	
	var usdtBalance = sellCryptoFromUsdt(orderBook, 40);
	console.log('usdtBalance: ', usdtBalance);
}

//[usdtBalance, cryptoBalance] = acceptSellCryptoOffer(0, 10, 251.1, 5, 0.04);
//console.log(usdtBalance, cryptoBalance);

main();