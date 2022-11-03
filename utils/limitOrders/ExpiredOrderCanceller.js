import {
	constants,
	DeflexLimitOrderFillerClient,
	DeflexLimitOrderPlatformClient,
} from "@deflex/deflex-sdk-js";
import {
	mnemonicToSecretKey
} from "algosdk";
import {createAlgodClient, createIndexerClient} from "../utilities";



class ExpiredOrderCanceller {
	static async cancelExpiredOrders() {
		const algod = createAlgodClient()
		const indexer = createIndexerClient()

		const expiredOrders = await DeflexLimitOrderFillerClient.fetchAllExpiredOrders(indexer, constants.CHAIN_MAINNET)
		const mnemonic = process.env.BACKEND_SIGNER_KEY.replace(/_/g, ' ')
		const backendAccount = mnemonicToSecretKey(mnemonic)
		const platformClient = new DeflexLimitOrderPlatformClient(algod, constants.CHAIN_MAINNET, backendAccount.addr, mnemonic)
		for (let i = 0; i < expiredOrders.length; i++) {
			const composer = await platformClient.prepareCancelOrder(expiredOrders[i])
			await composer.execute(algod, 4)
		}
	}
}

export default ExpiredOrderCanceller;