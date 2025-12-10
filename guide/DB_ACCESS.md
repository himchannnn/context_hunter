# DB 접근 가이드
## 1. DB 접속 방법(SSH)

```
mysql -u dbid253 -p
```

하면은 Enter password: 뜨는데

dbpass253

하고

```
MariaDB [(none)]>
```

이렇게 되면 MariaDB에 접속한 것이다.

## 2. DB 확인

```
show databases;
```

이렇게 하면 현재 있는 DB를 볼 수 있다.

## 3. DB 선택

```
use db25339;
```

이렇게 하면 context_hunter DB를 선택한 것이다.

## 4. DB 테이블 확인

```
show tables;
```

이렇게 하면 현재 DB에 있는 테이블을 볼 수 있다.

## 5. DB 테이블 데이터 확인

```
select * from context_hunter;
```

이렇게 하면 현재 DB에 있는 테이블의 데이터를 볼 수 있다.