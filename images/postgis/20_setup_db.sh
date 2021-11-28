echo 'RESTORE DB DUMP'
psql -U $POSTGRES_USER -d $POSTGRES_DB < /var/dump/data.sql
