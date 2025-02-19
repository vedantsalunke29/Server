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

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration for LAN IP range
const corsConfig = {
  origin: [/^http:\/\/10\.10\.(8|9|10|11|12|13|14|15)\.\d{1,3}(:\d+)?$/, 'http://localhost:5173', 'https://one-pict.vercel.app'], // Allow IPs in the range 10.10.8.x to 10.10.15.x
  methods: ['POST', 'GET', 'PUT', 'DELETE'],
  credentials: true // Allows sending cookies with requests
};

app.use(cors(corsConfig));
app.options('*', cors(corsConfig)); // Handle preflight requests

// Other middleware
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Routes
app.use('/api', userRoutes);

// Start the server
app.listen(host='0.0.0.0',port, () => console.log(`Server running on port: ${port}`));
