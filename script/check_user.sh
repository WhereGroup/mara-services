#/bin/bash

USER=$(whoami);
ALLOWED_USERS="sysmara tobi tweber rklemm";

if [[ $ALLOWED_USERS =~ (^|[[:space:]])"$USER"($|[[:space:]]) ]] 
then
  echo "Achtung: Sie führen das Skript jetzt mit dem Verfahrensuser ${USER} aus!" 
else
  echo "Dieses Skript muss als Verfahrensuser $ALLOWED_USERS ausgeführt werden..." 
  exit 1
fi
