export default class Swapper {

	constructor(assetInId, assetOutId, pool) {
		this.assetInId = assetInId;
		this.assetOutId = assetOutId;
		this.pool = pool;
	}

	static async fetchSwappers(chain, asset_in, asset_out) {
		throw new Error("abstract")
	}


	fetchQuote(amountIn) {
		throw new Error("abstract")
	}

	async getTransactionGroup(address, amountIn, minAmountOut, slippagePct) {
		throw new Error("abstract")
	}
}
