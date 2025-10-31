terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Usaremos un estado local para el frontend para simplificar,
  # pero en un equipo grande, usarías un backend S3 como en el backend.
}

provider "aws" {
  region = "us-east-2" # Asegúrate de que sea la misma región que tu backend
}

# --- 1. Bucket de S3 para alojar los archivos de React ---
resource "aws_s3_bucket" "site_bucket" {
  bucket = "clothes-vf-frontend-site-${random_id.id.hex}" # Nombre único para el bucket
}

# Bloquea el acceso público al bucket, forzando el tráfico a través de CloudFront
resource "aws_s3_bucket_public_access_block" "site_bucket_access_block" {
  bucket = aws_s3_bucket.site_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- 2. Identidad de CloudFront para acceder al Bucket S3 ---
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "clothes-vf-frontend-oac"
  description                       = "Origin Access Control for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Política que le da permiso a CloudFront para leer los archivos del bucket
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.site_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action    = "s3:GetObject",
        Effect    = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Resource  = "${aws_s3_bucket.site_bucket.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-clothes-vf-frontend"

    forwarded_values {
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.site_bucket.bucket_regional_domain_name
    origin_id                = "S3-clothes-vf-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    allowed_methods  =
    cached_methods   =
    target_origin_id = "S3-clothes-vf-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Redirige todos los errores 404 a index.html para que el enrutador de React funcione
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Generador de ID aleatorio para el nombre del bucket
resource "random_id" "id" {
  byte_length = 8
}

# --- 4. Salidas (Outputs) ---
# Terraform nos mostrará estos valores al final
output "cloudfront_url" {
  description = "La URL pública del sitio web"
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "s3_bucket_name" {
  description = "El nombre del bucket S3 donde se deben subir los archivos"
  value       = aws_s3_bucket.site_bucket.id
}

output "cloudfront_distribution_id" {
  description = "El ID de la distribución de CloudFront para invalidar la caché"
  value       = aws_cloudfront_distribution.cdn.id
}