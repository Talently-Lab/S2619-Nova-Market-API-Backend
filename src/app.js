import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import cartRoutes from './routes/cart.routes.js';
import productRoutes from './routes/product.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
const app = express();


app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Permite recibir JSON en las peticiones HTTP
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
    res.send('¡Bienvenido a Nova Market API!');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/carts', cartRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado'
    });
});

app.use(errorHandler);

export default app;
