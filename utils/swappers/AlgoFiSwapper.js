import {AlgofiAMMClient, Network} from "@algofi/amm-v0";
import Swapper from "./Swapper";
import {createAlgodClient} from "../utilities";

export default class AlgoFiSwapper extends Swapper {

	static async fetchSwappers(assetInId, assetOutId) {
		const algod = createAlgodClient()
		const algofi = new AlgofiAMMClient(algod, Network.MAINNET)
		const algofiAssetInId = parseInt(assetInId) === 0 ? 1 : parseInt(assetInId);
		const algofiAssetOutId = parseInt(assetOutId) === 0 ? 1 : parseInt(assetOutId);
		try {
			const pool = await algofi.getPool(this.getPoolType(), algofiAssetInId, algofiAssetOutId)
			return pool.poolStatus === 0 || pool.lpCirculation === 0 ? [] : [new this(assetInId, assetOutId, pool)]
		} catch (e) {
			return []
		}
	}

	fetchQuote(amount_in) {
		const algofiAssetInId = parseInt(this.assetInId) === 0 ? 1 : parseInt(this.assetInId);
		const quote = this.pool.getSwapExactForQuote(algofiAssetInId, amount_in)
		const amountReceived = this.assetInId > this.assetOutId ? quote.asset1Delta : quote.asset2Delta;
		return parseInt(amountReceived)
	}

	static getPoolType() {
		throw new Error('abstract')
	}

	async getTransactionGroup(address, amountIn, amountOut, slippagePct) {
		const minAmountOut = parseInt(amountOut * (100 - slippagePct) / 100)
		const assetInId = parseInt(this.assetInId) === 0 ? 1 : parseInt(this.assetInId);
		const quote = this.pool.getSwapExactForQuote(assetInId, parseInt(amountIn))
		const fee = 2000 + (quote?.extraComputeFee || 0)
		return await this.pool.getSwapExactForTxns(address, assetInId, parseInt(amountIn), minAmountOut, false, false, fee)
	}
}