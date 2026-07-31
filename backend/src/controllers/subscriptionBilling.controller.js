import {
    getSubscriptionBillsService,
} from "../services/billing.service.js";

export async function getSubscriptionBills(req, res) {

    try {

        const bills =
            await getSubscriptionBillsService();

        res.json({
            success: true,
            bills,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

}