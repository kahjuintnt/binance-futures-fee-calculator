# binance-futures-fee-calculator
A simple trading fee calculator for Binance futures market order that finds out how much fee you'll actually pay depending on the size of your order in USDT and current state of order book.

When a user executes a market order, a user pays trading fee. Besides that, there is also a hidden fee called spread.
For exmaple:

OrderBook    Price    Quantity (XMR)  
Sell offer - 214.42   0.65  
Sell offer - 214.38   8.00  
Sell offer - 214.35   0.25  
  
Buy offer -  214.33   1.00  
Buy offer -  214.32   0.04  
Buy offer -  214.27   9.50  

z
## Reference
https://academy.binance.com/en/articles/bid-ask-spread-and-slippage-explained
