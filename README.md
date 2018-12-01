# codingmon
database project


# 시작하기

## 패키지 설치

>  npm install

명령어 치면 package.json에 써있는 대로 자동으로 설치함.

## 파일 준비

### config/database.js 파일 생성
```javascript
  module.exports = {
      host: 'localhost',
      user: 'root',
      password: 'DB 비밀번호',
      port: 3306,
      database: 'codingmon'
  };
```
user랑 password는 DB 계정정본데, 보통 루트 계정만 쓰니깐...  
port는 DB 포트인데, mysql이면 보통 3306  
database는 mysql의 스키마 선택인데, 프로젝트2 sql스크립트 쓰면 자동으로 codingmon 생김
