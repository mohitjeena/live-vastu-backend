const express = require('express');
const router = express.Router();

router.post('/orders-paid', (req, res) => {
    const data = req.body;

    const vastuVariantIds = ['54345435435', '454353453345', '345435345435'];

    const lineItems = data?.line_items || [];

    const isVastuOrder = lineItems.some(item =>
        vastuVariantIds.includes(item.variant_id.toString())
    );

    console.log("Is Vastu Order:", isVastuOrder);

    res.status(200).send("OK");
});

module.exports = router;
