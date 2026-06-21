import multer, { MulterError } from 'multer';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file type. Only PDF and DOCX allowed.'));
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid audio format.'));
    }
  },
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid video format. Use MP4, WebM, or MOV.'));
    }
  },
});
