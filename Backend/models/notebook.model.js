const mongoose =require('mongoose')

const folderSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please provide folder name'],
        maxLength:20
    },
    // Legacy databases may still have a unique index on this field. It is now an
    // internal identifier only; it is not a cover image or user-facing asset.
    path:{
        type:String
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true})

module.exports=mongoose.model('Folder',folderSchema)
