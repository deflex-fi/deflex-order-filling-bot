import algosdk, {Algodv2, Indexer} from "algosdk";

export function createAlgodClient() {
	return new Algodv2(process.env.ALGOD_TOKEN, process.env.ALGOD_URI, process.env.ALGOD_PORT)
}

export function createIndexerClient() {
	return new Indexer(process.env.INDEXER_TOKEN, process.env.INDEXER_URI, process.env.INDEXER_PORT)
}

export async function getAccountAssets(algod, chain, address) {

	const accountInfo = await algod
		.accountInformation(address)
		.setIntDecoding(algosdk.IntDecoding.BIGINT)
		.do();

	const assetsFromRes = accountInfo.assets;

	const assets = assetsFromRes.map(({"asset-id": id, amount, creator, frozen}) => ({
		id: Number(id),
	}));

	assets.unshift({
		id: 0
	});

	return assets;
}