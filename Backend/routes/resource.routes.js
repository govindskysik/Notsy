const express= require("express");
const router= express.Router();
const resourceController=require('../controllers/resource.controller');

router.get('/:id',resourceController.getResourceById);
router.delete('/:id',resourceController.deleteResourceById);

module.exports=router;