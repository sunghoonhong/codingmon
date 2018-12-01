const local = require('./localStrategy');
const mysql = require('mysql2/promise');
const dbconfig = require('../config/database');
const pool = mysql.createPool(dbconfig);


module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const conn = await pool.getConnection(async conn => conn);
            try {
                const [exAdmin] = await conn.query(
                    'SELECT * FROM administrator WHERE id=?', id
                );
                const [exFree] = await conn.query(
                    'SELECT * FROM freelancer WHERE id=?', id
                );
                const [exClient] = await conn.query(
                    'SELECT * FROM client WHERE id=?', id
                );
                var user;
                if(exAdmin.length) {
                    user = exAdmin[0];
                    user.type = 'admin';
                }
                else if(exFree.length) {
                    user = exFree[0];
                    user.type = 'freelancer';
                }
                else if(exClient.length) {
                    user = exClient[0];
                    user.type = 'client';
                }
                done(null, user);
                conn.release();
            }
            catch (err) {
                conn.release();
                console.error('Query Error');
                done(err);
            }
        }
        catch (err) {
            conn.release();
            done(err);
        }
    });

    local(passport);
};