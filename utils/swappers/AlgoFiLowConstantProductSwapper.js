import {PoolType} from "@algofi/amm-v0";
import AlgoFiSwapper from "./AlgoFiSwapper";

export default class AlgoFiLowConstantProductSwapper extends AlgoFiSwapper {

	static getPoolType() {
		return PoolType.CONSTANT_PRODUCT_LOW_FEE
	}
}