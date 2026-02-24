import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../images"));
  },

  filename: (req, file, cb) => {
    const cleanFileName = file.originalname.replace(/\s+/g, "_");
    cb (null, Date.now() + "--" + cleanFileName)
  }
});

export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } 
});

