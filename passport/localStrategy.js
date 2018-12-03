const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dbconfig = require('../config/database');

const pool = mysql.createPool(dbconfig);

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'pw',
    }, async (id, pw, done) => {
        try {
            const conn = await pool.getConnection(async conn => conn);
            try {
                const [exAdmin] = await conn.query(
                    'SELECT id, password FROM admin WHERE id=?', id
                );
                if(exAdmin.length) {
                    conn.release();
                    const result = pw == exAdmin[0].password;
                    if (result) {
                        done(null, exAdmin[0]);
                    }
                    else {
                        done(null, false, {
                            message: 'wrong password'
                        });
                    }
                }
                else {
                    const [exUser] = await conn.query(
                        'SELECT id, password FROM freelancer WHERE id=? \
                            UNION   \
                        SELECT id, password FROM client WHERE id=?',
                        [id, id]
                    );
                    conn.release();
                    if (exUser.length) {
                        const result = await bcrypt.compare(pw, exUser[0].password);
                        if (result) {
                            done(null, exUser[0]);
                        }
                        else {
                            done(null, false, {
                                message: 'wrong password'
                            });
                        }
                    }
                    else {
                        done(null, false, {
                            message: 'Unregistered'
                        });
                    }
                }
            }
            catch (err) {
                console.error('Query Error');
                conn.release();
                done(err);
            }
        }
        catch (err) {
            console.error(err);
            conn.release();
            done(err);
        }
    }));
};