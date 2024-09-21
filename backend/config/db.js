const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri, {useNewUrlParser:true, useUnifiedTopology:true});
        console.log(`Successfully connected to mongoDB`);
    } catch (error) {
        console.error(`ERROR: ${error}`);
        process.exit(1);
    }
};

module.exports = connectDB;
