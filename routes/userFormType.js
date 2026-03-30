const UserFormType = required('../models/UserFormType')
const express = required("express")
const router = express.Router()


router.post('/',async (req,res)=>{
  try {
    const { formType } = req.body;

    // validation
    if (!["basic", "premium"].includes(formType)) {
      return res.status(400).json({ message: "Invalid form type" });
    }

    let existing = await UserFormType.findOne();

    if (existing) {
      existing.formType = formType;
      await existing.save();
    } else {
      await UserFormType.create({ formType });
    }

    res.status(200).json({
      success: true,
      message: "Form type updated successfully",
      formType
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
})


router.get('/', async (req, res) => {
  try {
    const existing = await UserFormType.findOne();

    return res.status(200).json({
      success: true,
      formType: existing?.formType || "basic" 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});


module.exports = router