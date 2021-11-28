FROM postgis/postgis

COPY data.sql /var/dump/data.sql
COPY 20_setup_db.sh /docker-entrypoint-initdb.d/20_setup_db.sh
