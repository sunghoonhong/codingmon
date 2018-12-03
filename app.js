const express = require('express');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();
const dbconfig = require('./config/database');

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const freelancerRouter = require('./routes/freelancer');
const clientRouter = require('./routes/client');
const passportConfig = require('./passport');

const app = express();
passportConfig(passport);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8001);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser('process.env.COOKIE_SECRET'));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'process.env.COOKIE_SECRET',
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/freelancer', freelancerRouter);
app.use('/client', clientRouter);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), 'port ready...');
});