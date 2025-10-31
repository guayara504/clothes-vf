# Cambia la versión de 3.9 a 3.12
FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt .
RUN mkdir -p /asset/python
RUN pip install -r requirements.txt -t /asset/python

