import multer from 'multer'

export const image = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname)
  }
});

const upload = multer({storage: image});


