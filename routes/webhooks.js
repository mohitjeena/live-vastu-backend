const express = require('express');
const router = express.Router();

router.post('/orders-paid', (req, res) => {
     const data = req.body;

    // 1. Vastu variant IDs
    const vastuVariantIds = ['51401779773752', '51401792553272', '51401807462712'];

    const lineItems = data?.line_items || [];

    const isVastuOrder = lineItems.some(item => {
        if (!item || !item.variant_id) return false;
        return vastuVariantIds.includes(item.variant_id.toString());
    });

    console.log("Is Vastu Order:", isVastuOrder);

    // 2. Extract session_id passed from checkout attributes
    const noteAttributes = data.note_attributes || [];
    let sessionId = null;

    for (let attr of noteAttributes) {
        if (attr.name === "session_id") {
            sessionId = attr.value;
        }
    }

    console.log("Session ID:", sessionId);

    // 3. If not Vastu order or missing session, exit gracefully
    if (!isVastuOrder || !sessionId) {
        return res.status(200).send("Not a Vastu order or missing session");
    }

    // 4. Now we will update your DB (next step)
    res.status(200).send("OK");
});

module.exports = router;
