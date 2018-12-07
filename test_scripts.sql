/* -------------------------------------------------------------------------------------------------------------- */
/* program_lang */

INSERT INTO program_lang VALUES ('c');
INSERT INTO program_lang VALUES ('python');
INSERT INTO program_lang VALUES ('java');
INSERT INTO program_lang VALUES ('javascript');


/* 
INSERT INTO program_lang VALUES ('php');
INSERT INTO program_lang VALUES ('pascal');
INSERT INTO program_lang VALUES ('perl');
INSERT INTO program_lang VALUES ('ruby');
INSERT INTO program_lang VALUES ('swift');*/



/* -------------------------------------------------------------------------------------------------------------- */
/* 회원 가입 */
/* 프리랜서 */

/* free1님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free1','123','프리원','01099999991',21,'cs',11, (select * from job_seeker order by job_seeker_id desc limit 1) );

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'c', 1) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'python', 2) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'java', 3) ;
/* free2님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free2','123','프리투','01099999992',22,'cs',12, (select * from job_seeker order by job_seeker_id desc limit 1));

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'c', 5) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'javascript', 2) ;
/* free3님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free3','123','프리쓰리','01099999993',23,'cs',13, (select * from job_seeker order by job_seeker_id desc limit 1));

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'java', 2) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'python', 4) ;

/* free4님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free4','123','프리포','01099999994',24,'cs',14, (select * from job_seeker order by job_seeker_id desc limit 1));

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'javascript', 5) ;

/* free5님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free5','123','프리파이브','01099999995',25,'cs',15, (select * from job_seeker order by job_seeker_id desc limit 1));

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'python', 2) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'java', 3) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'c', 1) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'javascript', 4) ;

/* free6님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free6','123','프리식스','01099999996',26,'cs',16, (select * from job_seeker order by job_seeker_id desc limit 1));

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'c', 4) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'python', 3) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'java', 3) ;

/* free7님 회원가입 */
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free7','123','프리세븐','01099999997',27,'cs',17, (select * from job_seeker order by job_seeker_id desc limit 1) );

insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'c', 1) ;
insert into knows VALUES ((select * from job_seeker order by job_seeker_id desc limit 1), 'java', 3) ;

/* -------------------------------------------------------------------------------------------------------------- */

/* 의뢰자 회원가입 */
INSERT INTO client(id, password,name,phone_num)
VALUES ('client1','456','의뢰자원','01011111111');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client2','456','의뢰자투','01011111112');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client3','456','의뢰자쓰리','01011111113');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client4','456','의뢰자포','01011111114');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client5','456','의뢰자파이브','01011111115');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client6','456','의뢰자식스','01011111116');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client7','456','의뢰자세븐','01011111117');

/* -------------------------------------------------------------------------------------------------------------- */
/* 의뢰 올리기*/
/* client1이 doitplz1 request를 올림*/
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client1','doitplz1',301,'2018-01-01 00:00:00','2018-02-01 23:59:59',1,3,11);
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'c', 1) ;

/* client1이 doitplz2 request를 올림*/
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client1','doitplz2',302,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,3,11);
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'c', 3) ;

/* client2가 doitplz3 request를 올림*/
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client2','doitplz3',303,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,4,13);
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'c', 3) ;
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'java', 2) ;

/* client3가 doitplz4 request를 올림*/
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client3','doitplz4',304,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,3,14);
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'python', 2) ;
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'javascript', 2) ;


/* client4가 doitplz5 request를 올림*/
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client4','doitplz5',305,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,4,11);
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'python', 5) ;
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'javascript', 5) ;
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'c', 5) ;
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'java', 5) ;

/* client4가 doitplz6 request를 올림*/
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client4','doitplz6',306,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,4,15);
insert into requires VALUES ((select rqid from request order by rqid desc limit 1), 'python', 1) ;