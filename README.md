# Deflex Limit Order Filling Bot

Earn passive income by filling open limit orders and cancelling expired limit orders.
Orders are filled with liquidity from Pact and Algofi.

## Prerequisites
* Install `npm`
* Own an Algorand wallet with at least a couple of ALGO
* Make sure there is no process running on port 3001

## Running the bot

1. Clone this repository and change directory: 
  * `git clone https://github.com/deflex-fi/deflex-order-filling-bot && cd deflex-order-filling-bot`
2. Set the BACKEND_SIGNER_KEY variable in `.env.local` to the 25-word mnemonic of your Algorand wallet, separated by underscores.
3. (Optional) Set the other variables in `.env.local`, if you'd like to use a cost Algod/Indexer client.
4. Install node dependencies:
  * `npm install`
4. Start next dev server:
  * `npm run dev`
5. (In a separate terminal, same directory) Run the bot:
  * `npm run fill-orders`


