# binance-futures-fee-calculator
A simple trading fee calculator for Binance futures market order that finds out how much fee you'll actually pay depending on the size of your order in USDT and current state of order book.

When a user executes a market order, a user pays trading fee. Besides that, there is also a hidden fee called spread.
Let's assume a senerio with no trading fees:
<pre>
OrderBook    Price    Quantity (XMR)  
Sell offer - 214.42   0.65  
Sell offer - 214.38   8.00  
Sell offer - 214.35   0.25  

Mid price  - 214.34

Buy offer -  214.33   1.00  
Buy offer -  214.32   0.04  
Buy offer -  214.18   9.50  
</pre>

When a user sell 10XMR via market order, he/she is accepting best offers on the order book.
Hence, he/she ends up selling 1XMR at $214.33, 0.04XMR at $214.18 and 8.96XMR at $214.27.

According to the mid price, he/she has this much worth of XMR
<pre>
214.34 x 10 = $2143.40
</pre>

But after selling the XMR, he/she gets
<pre>
(214.33 x 1) + (214.32 x 0.04) + (214.18 x 8.96) = $2141.96
</pre>

Percentage amount lost due to spread is:
<pre>
(2141.96 - 2143.40) x 100 / 2143.40 = -0.06718298031%
</pre>

## Reference
https://academy.binance.com/en/articles/bid-ask-spread-and-slippage-explained
