terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "tfstate-clothes-vf-backend" # <-- CAMBIA ESTO
    key    = "global/s3/terraform.tfstate"
    region = "us-east-2" # <-- VERIFICA TU REGIÓN
  }
}

provider "aws" {
  region = "us-east-2" # <-- VERIFICA TU REGIÓN
}

# --- BASE DE DATOS (DYNAMODB) ---
resource "aws_dynamodb_table" "products_table" {
  name         = "Products"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "productId"
  attribute {
    name = "productId"
    type = "S"
  }
}
resource "aws_dynamodb_table" "orders_table" {
  name         = "Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"
  attribute {
    name = "orderId"
    type = "S"
  }
}

# --- PERMISOS (IAM) ---
resource "aws_iam_role" "lambda_exec_role" {
  name = "clothes-vf-lambda-execution-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}
resource "aws_iam_policy" "lambda_policy" {
  name   = "clothes-vf-lambda-policy"
  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action   = "dynamodb:*",
        Effect   = "Allow",
        Resource = [aws_dynamodb_table.products_table.arn, aws_dynamodb_table.orders_table.arn]
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "lambda_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# --- CAPA DE DEPENDENCIAS Y FUNCIÓN LAMBDA ---
resource "aws_lambda_layer_version" "app_dependencies" {
  layer_name        = "clothes-vf-dependencies"
  filename          = "../layer.zip"
  source_code_hash  = filebase64sha256("../layer.zip")
  compatible_runtimes = ["python3.12"]
}
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = ".." # Sube a la raíz de /backend
  output_path = "code.zip"

  # Excluimos carpetas y archivos innecesarios
  excludes = [
    ".venv",
    "terraform",
    "build",
    "layer.zip",
    "Dockerfile",
    ".gitignore"
  ]
}
resource "aws_lambda_function" "api_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "clothes-vf-api-lambda"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "handler.main_handler"
  layers           = [aws_lambda_layer_version.app_dependencies.arn]
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.12"
  environment {
    variables = {
      PRODUCTS_TABLE      = aws_dynamodb_table.products_table.name
      ORDERS_TABLE        = aws_dynamodb_table.orders_table.name
      DYNAMODB_REGION     = "us-east-2"
      # Usamos las llaves del Botón de Pagos
      BOLD_IDENTITY_KEY   = "LkJT-I3jHFjuRJb5u-iZ2eD3ULrBYRyK-VewRFej2hI" # La que encontraste
      BOLD_SECRET_KEY     = "HbYtouJmdhWLnENaFBOj_g" # La que encontraste
    }
  }
}

# --- API GATEWAY ---
resource "aws_api_gateway_rest_api" "api" {
  name = "clothes-vf-api"
}
resource "aws_api_gateway_method" "root_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_rest_api.api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_rest_api.api.root_resource_id
  http_method             = aws_api_gateway_method.root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}
resource "aws_api_gateway_resource" "proxy_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}
resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.proxy_resource.id
  http_method             = aws_api_gateway_method.proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}
resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy_resource.id,
      aws_api_gateway_method.proxy_method.id,
      aws_api_gateway_integration.proxy_integration.id,
      aws_api_gateway_method.root_method.id,
      aws_api_gateway_integration.root_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}
resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "v1"
}
output "api_url" {
  description = "The invocation URL for the API Gateway stage"
  value       = aws_api_gateway_stage.api_stage.invoke_url
}