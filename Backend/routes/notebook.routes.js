const express= require("express");
const router= express.Router();
const folderController=require('../controllers/notebook.controller');

router.post('/',folderController.createFolder);
router.get('/',folderController.getAllFolders); //working fine
router.get('/:id',folderController.getFolderById);//working fine
router.delete('/:id',folderController.deleteFolder);//working fine

module.exports=router;
