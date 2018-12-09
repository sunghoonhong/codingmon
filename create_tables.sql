CREATE DATABASE IF NOT EXISTS codingmon;
USE codingmon;

CREATE TABLE IF NOT EXISTS admin (
    id VARCHAR(20) NOT NULL,
    password VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO admin(id, password) SELECT 'admin', '123'
WHERE NOT EXISTS (SELECT * FROM admin WHERE id='admin');

CREATE TABLE IF NOT EXISTS job_seeker (
    job_seeker_id INT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (job_seeker_id)
);

CREATE TABLE IF NOT EXISTS freelancer (
    id VARCHAR(20) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(20) NOT NULL,
    phone_num VARCHAR(11) NOT NULL,
    rating float(7,2),
    age INT NOT NULL,
    major VARCHAR(20) NOT NULL,
    career INT NOT NULL,
    job_seeker_id INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (job_seeker_id)
        REFERENCES job_seeker (job_seeker_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS team (
    tname VARCHAR(20) NOT NULL,
    career INT,
    mgr_id VARCHAR(20) NOT NULL,
    people_num INT DEFAULT 0,
    job_seeker_id INT NOT NULL,
    PRIMARY KEY (tname),
    FOREIGN KEY (mgr_id)
        REFERENCES freelancer (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (job_seeker_id)
        REFERENCES job_seeker (job_seeker_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS participates (
    fid VARCHAR(20) NOT NULL,
    tname VARCHAR(20) NOT NULL,
    PRIMARY KEY (fid , tname),
    FOREIGN KEY (fid)
        REFERENCES freelancer (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (tname)
        REFERENCES team (tname)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client (
    id VARCHAR(20) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(20) NOT NULL,
    phone_num VARCHAR(11) NOT NULL,
    rating float(7,2),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS request (
    rqid INT NOT NULL AUTO_INCREMENT,
    cid VARCHAR(20) NOT NULL,
    rname VARCHAR(100) NOT NULL,
    reward INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    dev_start DATETIME,
    dev_end DATETIME,
    min_people INT NOT NULL,
    max_people INT NOT NULL,
    min_career INT NOT NULL,
    FOREIGN KEY (cid)
        REFERENCES client (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (rqid)
);

CREATE TABLE IF NOT EXISTS document (
    did INT NOT NULL AUTO_INCREMENT,
    dfile VARCHAR(100) NOT NULL,
    rqid INT NOT NULL,
    FOREIGN KEY (rqid)
        REFERENCES request (rqid)
        ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (did)
);


CREATE TABLE IF NOT EXISTS program_lang (
    lang_name VARCHAR(20) NOT NULL,
    PRIMARY KEY (lang_name)
);

INSERT INTO program_lang SELECT 'C'
WHERE NOT EXISTS (SELECT * FROM program_lang WHERE lang_name='C');
INSERT INTO program_lang SELECT 'Java'
WHERE NOT EXISTS (SELECT * FROM program_lang WHERE lang_name='Java');
INSERT INTO program_lang SELECT 'Python'
WHERE NOT EXISTS (SELECT * FROM program_lang WHERE lang_name='Python');
INSERT INTO program_lang SELECT 'JavaScript'
WHERE NOT EXISTS (SELECT * FROM program_lang WHERE lang_name='JavaScript');

CREATE TABLE IF NOT EXISTS knows (
    job_seeker_id INT NOT NULL,
    lang_name VARCHAR(20) NOT NULL,
    level INT NOT NULL,
    PRIMARY KEY (job_seeker_id , lang_name),
    FOREIGN KEY (job_seeker_id)
        REFERENCES job_seeker (job_seeker_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (lang_name)
        REFERENCES program_lang (lang_name)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS requires (
    rqid INT NOT NULL,
    lang_name VARCHAR(20) NOT NULL,
    level INT NOT NULL,
    PRIMARY KEY (rqid , lang_name),
    FOREIGN KEY (rqid)
        REFERENCES request (rqid)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (lang_name)
        REFERENCES program_lang (lang_name)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applys (
    rqid INT NOT NULL,
    job_seeker_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    PRIMARY KEY (rqid , job_seeker_id),
    FOREIGN KEY (rqid)
        REFERENCES request (rqid)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (job_seeker_id)
        REFERENCES job_seeker (job_seeker_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report (
    rid INT NOT NULL AUTO_INCREMENT,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' ,
    rfile VARCHAR(100) NOT NULL,
    rqid INT NOT NULL,
    job_seeker_id INT NOT NULL,
    PRIMARY KEY (rid),
    FOREIGN KEY (job_seeker_id)
        REFERENCES job_seeker (job_seeker_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (rqid)
        REFERENCES request (rqid)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accepted (
    arid INT NOT NULL,
    j_rating float(7,2),
    c_rating float(7,2),
    PRIMARY KEY (arid),
    FOREIGN KEY (arid)
        REFERENCES report (rid)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS declined (
    drid INT NOT NULL,
    message TEXT NOT NULL,
    PRIMARY KEY (drid),
    FOREIGN KEY (drid)
        REFERENCES report (rid)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS owns_external (
    pid INT NOT NULL AUTO_INCREMENT,
    efile VARCHAR(100) NOT NULL,
    fid VARCHAR(20) NOT NULL,
    PRIMARY KEY (pid),
    FOREIGN KEY (fid)
        REFERENCES freelancer (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS owns_internal (
    pid INT NOT NULL AUTO_INCREMENT,	
    fid VARCHAR(20) NOT NULL,
    arid INT NOT NULL,
    PRIMARY KEY (pid),
    FOREIGN KEY (fid)
        REFERENCES freelancer (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (arid)
        REFERENCES accepted (arid)
        ON UPDATE CASCADE ON DELETE CASCADE
);


 CREATE TABLE IF NOT EXISTS f_rating_stat (
    id VARCHAR(20) NOT NULL,
    rating_sum float(7,2) DEFAULT 0,
	count_sum INT DEFAULT 0,
	avg_rating float(7,2),
    PRIMARY KEY (id),
    FOREIGN KEY (id)
        REFERENCES freelancer (id)
        ON DELETE CASCADE ON UPDATE CASCADE	
);

 CREATE TABLE IF NOT EXISTS c_rating_stat (
    id VARCHAR(20) NOT NULL,
    rating_sum float(7,2) DEFAULT 0,
	count_sum INT DEFAULT 0,
	avg_rating float(7,2),
    PRIMARY KEY (id),
    FOREIGN KEY (id)
        REFERENCES client (id)
        ON DELETE CASCADE ON UPDATE CASCADE	
);