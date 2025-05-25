import express from 'express';
import session from 'express-session';
import router from './routes/routes.js';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: 'mi-secreto', // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: true,    
  })
);

app.use(router);

export default app;
