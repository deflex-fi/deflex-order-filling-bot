import OrderFiller from "../../utils/limitOrders/OrderFiller";
import ExpiredOrderCanceller from "../../utils/limitOrders/ExpiredOrderCanceller";


export default async function handler(req, res) {
	if (process.env.NODE_ENV !== 'development') {
		res.status(404)
		return
	}
	do {
		// fill orders
		try {
			await OrderFiller.fillOrders()
		} catch (e) {
			console.log(e)
		}
		// cancel expired orders (earn 0.1 ALGO for each one)
		try {
			await ExpiredOrderCanceller.cancelExpiredOrders()
		} catch (e) {
			console.log(e)
		}
		// wait 1 seconds, then keep going
		await new Promise(r => setTimeout(r, 1000));
	} while (true)
}
