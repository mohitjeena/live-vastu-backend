const express = require('express');
const router = express.Router();

router.post('/orders-paid', (req, res) => {
    console.log("Webhook: Order Paid Received");
    console.log(req.body);

    res.status(200).send("OK");
});

module.exports = router;
