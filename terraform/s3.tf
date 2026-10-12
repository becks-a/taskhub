resource "aws_s3_bucket" "monitoring_logs" {
  bucket_prefix = "taskhub-monitoring-logs-"

  tags = {
    Name    = "taskhub-monitoring-logs"
    Purpose = "Monitoring logs"
  }
}

resource "aws_s3_bucket_public_access_block" "monitoring_logs" {
  bucket = aws_s3_bucket.monitoring_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "monitoring_logs" {
  bucket = aws_s3_bucket.monitoring_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "monitoring_logs" {
  bucket = aws_s3_bucket.monitoring_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}
