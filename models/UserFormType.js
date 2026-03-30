const mongoose = require("mongoose");

const userFormTypeSchema =  new mongoose.Schema({
    formType:
    {
      type: String,
      enum: ["basic","premium"],
      required: true,
      default: "basic"
    } 
})

module.exports = mongoose.model('UserFormType',userFormTypeSchema)