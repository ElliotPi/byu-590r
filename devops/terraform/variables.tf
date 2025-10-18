# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "byu-590r"
}

variable "key_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = "byu-590r"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

# Outputs
output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.byu_590r_server.id
}

output "instance_ip" {
  description = "EC2 Instance Public IP"
  value       = aws_instance.byu_590r_server.public_ip
}

output "elastic_ip" {
  description = "Elastic IP address"
  value       = aws_eip.byu_590r.public_ip
}

output "allocation_id" {
  description = "Elastic IP Allocation ID"
  value       = aws_eip.byu_590r.id
}

output "ec2_host" {
  description = "EC2 Host (Elastic IP)"
  value       = aws_eip.byu_590r.public_ip
}

output "s3_bucket" {
  description = "S3 Bucket name"
  value       = aws_s3_bucket.byu_590r.bucket
}

output "security_group_id" {
  description = "Security Group ID"
  value       = aws_security_group.byu_590r.id
}

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}
