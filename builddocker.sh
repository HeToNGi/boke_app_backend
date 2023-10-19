#!/bin/bash

# 开发环境

service_name="boke-app-backend"
service_version="1.0"
NODE_ENV="dev"

docker stop ${service_name}

docker rm ${service_name}

docker rmi ${service_name}:${service_version}

docker build -t ${service_name}:${service_version} .

docker run -i --init -p 8080:8080 -e NODE_ENV=${NODE_ENV} -v /root/mySpace/get_news:/usr/src/app/get_news -v /usr/bin/python3.6:/usr/bin/python3.6 -v /usr/lib/python3.6:/usr/lib/python3.6 -d -t --cap-add=SYS_ADMIN --name ${service_name} ${service_name}:${service_version}
