import {PoolType} from "@algofi/amm-v0";
import AlgoFiSwapper from "./AlgoFiSwapper";

export default class AlgoFiNanoSwapper extends AlgoFiSwapper {
	static getPoolType() {
		return PoolType.NANOSWAP
	}
}