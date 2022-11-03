import {PoolType} from "@algofi/amm-v0";
import AlgoFiSwapper from "./AlgoFiSwapper";

export default class AlgoFiHighConstantProductSwapper extends AlgoFiSwapper {

	static getPoolType() {
		return PoolType.CONSTANT_PRODUCT_HIGH_FEE
	}
}