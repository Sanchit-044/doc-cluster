import http, {createServer} from 'http';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { connectDB } from './config/prisma.config';
const app = express();
const PORT = process.env.PORT || 4000;
const httpsServer = createServer(app);
// app.get('/', (req, res) => {
//     res.send('sever is running');
// });
try{connectDB()
    .then(() => {
        httpsServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
}catch(error){
    console.error("Failed to start server:", error);
}