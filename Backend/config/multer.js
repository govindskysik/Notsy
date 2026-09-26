const multer =require('multer');
const path =require('path');
const fs = require('fs');

const storage=(destination)=>multer.diskStorage({
    destination: (req, file, cb) => {
        // Upload directories are runtime data and are absent in a fresh clone.
        const uploadPath = path.resolve(__dirname, '..', destination);
        fs.mkdir(uploadPath, { recursive: true }, (error) => cb(error, uploadPath));
    },
    filename:(req,file,cb)=>{
        cb(null,`${Date.now()}-${file.originalname}`);
    }
});

const checkFileType=(file,cb)=>{
    let filetype;
    if(file.fieldname==='coverImage'){
        filetype=/jpeg|jpg|png/;
    }else if(file.fieldname==='pdf'){
        filetype=/pdf/;
    }
    
    if(!filetype){
        return cb('Error: No file types defined');
    }
    const extname=filetype.test(path.extname(file.originalname).toLowerCase()); 
    const mimetype=filetype.test(file.mimetype);
    if(extname && mimetype){
        return cb(null,true);   
    }else{
        cb('Error: File upload only supports the following filetypes - ' + filetype);
    }

}

const upload=(destination)=>multer({
    storage:storage(destination),
    limits:{fileSize:20000000},
    fileFilter:(req,file,cb)=>{
        checkFileType(file,cb);
    }   
}).fields([
    {name:'coverImage',maxCount:1},
    {name:'pdf',maxCount:3}
])

module.exports=upload;
