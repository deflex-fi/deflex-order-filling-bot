import pactsdk from "@pactfi/pactsdk";
import Swapper from "./Swapper";
import {createAlgodClient} from "../utilities";

export default class PactSwapper extends Swapper {

	static async fetchSwappers(assetInId, assetOutId) {
		const algod = createAlgodClient()
		const pact = new pactsdk.PactClient(algod);
		const pools = await pact.fetchPoolsByAssets(assetInId, assetOutId)
		return pools.map(pool => new PactSwapper(assetInId, assetOutId, pool))
	}

	fetchQuote(amount_in) {
		const assetIn = parseInt(this.assetInId) === parseInt(this.pool.primaryAsset.index) ? this.pool.primaryAsset : this.pool.secondaryAsset
		const swap = this.pool.prepareSwap({asset: assetIn, amount: amount_in, slippagePct: 0})
		return swap.effect.amountReceived
	}

	async getTransactionGroup(address, amountIn, amountOut, slippagePct) {
		const assetIn = parseInt(this.assetInId) === parseInt(this.pool.primaryAsset.index) ? this.pool.primaryAsset : this.pool.secondaryAsset
		const swap = this.pool.prepareSwap({asset: assetIn, amount: parseInt(amountIn), slippagePct: slippagePct})
		const txns = await swap.prepareTxGroup(address)
		return txns.transactions
	}
}