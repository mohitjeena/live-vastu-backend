const express=  require("express")
const router = express.Router()
const UserDetails = require("../models/userDetails")


router.get('/:id',async (req,res)=>{
    try {
        const { id } = req.params;
       const exist =  await UserDetails.findOne( {userId: id} )
       if(exist)
       {
        res.status(200).json({
            message: "details found",
            data: exist,
            success: true
        })
       }
       else{
            res.status(404).json({
            message: "details not found",
            success: false
        })
       }
        
    } catch (error) {
        console.log("error while fetching user details ",error)
        res.status(500).json({
            success:false,
            message: "internal server error"
        })
    }
})

module.exports = router;