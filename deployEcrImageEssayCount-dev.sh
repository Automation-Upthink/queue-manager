# aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 462203881643.dkr.ecr.ap-south-1.amazonaws.com
# docker build -t dev-scripts:latest . -f ./DockerfileTimeLog
# docker tag dev-scripts:latest 462203881643.dkr.ecr.ap-south-1.amazonaws.com/qm-essaycount-dev:latest
# docker push 462203881643.dkr.ecr.ap-south-1.amazonaws.com/qm-essaycount-dev:latest