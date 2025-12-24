const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');

router.post('/orders-paid',async (req, res) => {

     try {

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
    let planType = null;
     let email = null;


    for (let attr of noteAttributes) {
        if (attr.name === "session_id") sessionId = attr.value;
        if (attr.name === "plan_type") planType = attr.value;
        if (attr.name === "email") email = attr.value;
        }
    
         const phone =
  data.phone ||
  data.customer?.phone ||
  data.shipping_address?.phone ||
  data.billing_address?.phone ||
  '';

    console.log("Session ID:", sessionId);
    console.log("Plan Type:", planType);

    // 3. If not Vastu order or missing session, exit gracefully
    if (!isVastuOrder || !sessionId) {
        return res.status(200).send("Not a Vastu order or missing session");
    }

   
           let userSubmission = await UserSubmission.findOne({ session_id: sessionId });
           
           if (!userSubmission) {
               userSubmission = new UserSubmission({ session_id: sessionId })
           }
      const orderId = data.id; 
     
      if(userSubmission.customer_email) 
        email = userSubmission.customer_email
           
               userSubmission.plan_type = planType || 'basic';
               userSubmission.payment_status = 'completed';
               userSubmission.order_id = orderId;
               userSubmission.has_paid_features = true;
                userSubmission.mobile_number = phone; 
                userSubmission.customer_email = data.customer.email ? data.customer.email : email;
                userSubmission.vastu_task = false;
   
           await userSubmission.save();
   
           res.json({
               success: true,
               data: userSubmission,
               message: 'Plan updated successfully'
           });
       } catch (error) {
           console.error('Error updating user plan:', error);
           res.status(500).json({
               success: false,
               message: 'Error updating user plan'
           });
       }

});




module.exports = router;
