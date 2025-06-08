import { handler as ssrHandler } from './dist/server/entry.mjs';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static('dist/client'));

// Middleware para manejar las rutas de Astro
app.use(ssrHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
