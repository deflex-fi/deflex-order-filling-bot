import {constants, DeflexLimitOrderFillerClient} from "@deflex/deflex-sdk-js";
import algosdk, {
	AtomicTransactionComposer,
	makeAssetTransferTxnWithSuggestedParamsFromObject,
	makeBasicAccountTransactionSigner,
	makePaymentTxnWithSuggestedParamsFromObject,
	mnemonicToSecretKey
} from "algosdk";
import {createAlgodClient, createIndexerClient, getAccountAssets} from "../utilities";
import AlgoFiNanoSwapper from "../swappers/AlgoFiNanoSwapper";
import AlgoFiLowConstantProductSwapper from "../swappers/AlgoFiLowConstantProductSwapper";
import AlgoFiHighConstantProductSwapper from "../swappers/AlgoFiHighConstantProductSwapper";
import PactSwapper from "../swappers/PactSwapper";


const SWAPPERS = [
	AlgoFiNanoSwapper,
	AlgoFiLowConstantProductSwapper,
	AlgoFiHighConstantProductSwapper,
	PactSwapper
]
const SLIPPAGE = 0.1

class OrderFiller {
	static async fillOrders() {
		const indexer = createIndexerClient()
		const algod = createAlgodClient()

		let openOrders = await DeflexLimitOrderFillerClient.fetchAllOpenOrders(indexer, constants.CHAIN_MAINNET)
		const key = process.env.BACKEND_SIGNER_KEY.replace(/_/g, ' ')
		const backendAccount = mnemonicToSecretKey(key)
		const fillerClient = new DeflexLimitOrderFillerClient(algod, constants.CHAIN_MAINNET, key)
		const backendSigner = makeBasicAccountTransactionSigner(backendAccount)

		// fetch liquidity pool state
		let totalFilled = 0
		let totalFees = {}

		const protocolTreasuryAppId = constants.PROTOCOL_TREASURY_APP_IDS[constants.CHAIN_MAINNET]
		const protocolTreasuryAddress = algosdk.getApplicationAddress(protocolTreasuryAppId)
		const backendAssets = await getAccountAssets(algod, constants.CHAIN_MAINNET, backendAccount.addr)

		// bin assets by trading pair
		let orderMap = {}
		let keys = []
		openOrders.map(order => {
			const key = `${order.assetInId}-${order.assetOutId}`
			if (!(key in orderMap)) {
				orderMap[key] = []
				keys.push(key)
			}
			orderMap[key].push(order)
		})

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			const orders = orderMap[key]
			const assetInId = orders[0].assetInId
			const assetOutId = orders[0].assetOutId
			let swappers = []
			await Promise.all(SWAPPERS.map(async SWAPPER => {
				try {
					const _swappers = await SWAPPER.fetchSwappers(assetInId, assetOutId)
					swappers = [...swappers, ..._swappers]
				} catch {
					// skip
				}
			}))
			for (let j = 0; j < orders.length; j++) {
				const openOrder = orders[j]
				const minAmountOut = Math.ceil(openOrder.amountOut * ((10000 + openOrder.feeBps) / 10000))
				let bestQuote = 0
				let bestSwapper = null
				for (let k = 0; k < swappers.length; k++) {
					const swapper = swappers[k]
					const quote = swapper.fetchQuote(openOrder.amountIn)
					if (quote > bestQuote) {
						bestQuote = quote
						bestSwapper = swapper
					}
				}
				if ((bestQuote * (100 - SLIPPAGE) / 100) < minAmountOut) {
					continue
				}
				const params = await algod.getTransactionParams().do()
				const transactions = await bestSwapper.getTransactionGroup(backendAccount.addr, openOrder.amountIn, openOrder.amountOut, SLIPPAGE)
				const transactionWithSigners = transactions.map(txn => {
					delete (txn.group)
					return {
						txn: txn,
						signer: backendSigner
					}
				})
				if (parseInt(openOrder.assetOutId) === 0) {
					transactionWithSigners.push({
						txn: makePaymentTxnWithSuggestedParamsFromObject({
							from: backendAccount.addr,
							suggestedParams: params,
							to: algosdk.getApplicationAddress(openOrder.limitOrderAppId),
							amount: minAmountOut,
							rekeyTo: undefined
						}),
						signer: backendSigner
					})
				} else {
					transactionWithSigners.push({
						txn: makeAssetTransferTxnWithSuggestedParamsFromObject({
							from: backendAccount.addr,
							suggestedParams: params,
							to: algosdk.getApplicationAddress(openOrder.limitOrderAppId),
							amount: minAmountOut,
							assetIndex: openOrder.assetOutId,
							rekeyTo: undefined
						}),
						signer: backendSigner
					})
				}
				// opt in treasury asset
				if (parseInt(openOrder.assetInId) !== 0 &&
					(backendAssets.filter(asset => parseInt(asset.id) === parseInt(openOrder.assetInId))).length === 0) {
					const optInComposer = new AtomicTransactionComposer()
					optInComposer.addTransaction({
						txn: makeAssetTransferTxnWithSuggestedParamsFromObject({
							from: backendAccount.addr,
							suggestedParams: params,
							to: backendAccount.addr,
							amount: 0,
							assetIndex: openOrder.assetInId,
							rekeyTo: undefined
						}),
						signer: backendSigner
					})
					await optInComposer.execute(algod, 4)
					backendAssets.push({
						id: openOrder.assetInId
					})
				}
				if (parseInt(openOrder.assetOutId) !== 0 &&
					(backendAssets.filter(asset => parseInt(asset.id) === parseInt(openOrder.assetOutId))).length === 0) {
					const optInComposer = new AtomicTransactionComposer()
					optInComposer.addTransaction({
						txn: makeAssetTransferTxnWithSuggestedParamsFromObject({
							from: backendAccount.addr,
							suggestedParams: params,
							to: backendAccount.addr,
							amount: 0,
							assetIndex: openOrder.assetOutId,
							rekeyTo: undefined
						}),
						signer: backendSigner
					})
					await optInComposer.execute(algod, 4)
					backendAssets.push({
						id: openOrder.assetOutId
					})
				}
				const composer = await fillerClient.prepareBackendFillOrder(openOrder, transactionWithSigners, backendAccount.addr, protocolTreasuryAddress, params)
				try {
					await composer.execute(algod, 4)
					totalFilled++
					if (!(openOrder.assetOutId in totalFees)) {
						totalFees[openOrder.assetOutId] = 0
					}
					totalFees[openOrder.assetOutId] += parseInt(openOrder.amountOut * (openOrder.feeBps) / 10000)
				} catch {
				}
			}
		}
	}
}

export default OrderFiller;

