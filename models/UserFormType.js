const mongoose = require("mongoose");

const userFormTypeSchema =  new mongoose.Schema({
    formType:
    {
      type: String,
      enum: ["basic","premium"],
      required: true
    } 
})

module.exports = mongoose.model('UserFormType',userFormTypeSchema)