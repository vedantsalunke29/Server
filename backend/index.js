const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

dotenv.config();

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const corsConfig = {
  origin: ['https://one-pict.vercel.app', 'http://localhost:5173'],
  methods: ['POST', 'GET', 'PUT', 'DELETE'],
  credential: true
};

app.use(cors(corsConfig));
app.options('', cors(corsConfig));
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use('/', userRoutes);

app.listen(port, () => console.log(`Server running on port: ${port}`));
