# aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 876531729711.dkr.ecr.ap-south-1.amazonaws.com
# docker build -t dev-scripts:latest . -f ./DockerfileTimeLog
# docker tag dev-scripts:latest 876531729711.dkr.ecr.ap-south-1.amazonaws.com/qm-essaycount-dev:latest
# docker push 876531729711.dkr.ecr.ap-south-1.amazonaws.com/qm-essaycount-dev:latest