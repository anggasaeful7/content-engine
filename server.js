require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tags route
app.use('/api/tags', require('./app/routes/api/hashtags'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use('/', require('./app/routes/web/dashboard'));
app.use('/sources', require('./app/routes/web/sources'));
app.use('/ideas', require('./app/routes/web/ideas'));
app.use('/contents', require('./app/routes/web/contents'));
app.use('/competitors', require('./app/routes/web/competitors'));

app.use('/api/sources', require('./app/routes/api/sources'));
app.use('/api/ideas', require('./app/routes/api/ideas'));
app.use('/api/contents', require('./app/routes/api/contents'));
app.use('/api/analytics', require('./app/routes/api/analytics'));
app.use('/api/trends', require('./app/routes/api/trends'));
app.use('/api/competitors', require('./app/routes/api/competitors'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Angscode running on port', PORT));
