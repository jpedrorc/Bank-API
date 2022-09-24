require('dotenv').config();
const app = require('./');
const newExtract = {};
console.log(`App funcionando na porta ${process.env.PORT}`);
app.listen(process.env.PORT);
