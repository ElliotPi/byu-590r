# Data sources to find existing resources

# Find EC2 instances with BYU 590R tags
data "aws_instances" "byu_590r" {
  filter {
    name   = "tag:Name"
    values = ["byu-590r-server"]
  }
  
  filter {
    name   = "instance-state-name"
    values = ["running", "pending", "stopped"]
  }
}

# Find Elastic IPs with BYU 590R tags
data "aws_eips" "byu_590r" {
  filter {
    name   = "tag:Name"
    values = [var.project_name]
  }
}

# Find security groups with BYU 590R tags
data "aws_security_groups" "byu_590r" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-sg"]
  }
}

# Variables (inherited from main configuration)

variable "confirm_destroy" {
  description = "Set to true to confirm destruction of all resources"
  type        = bool
  default     = false
}

# Local values for resource identification
locals {
  # For now, we'll use a simple approach to find BYU 590R buckets
  # This is a simplified version that assumes bucket naming convention
  byu_s3_buckets = []
}

# Output information about resources that will be destroyed
output "resources_to_destroy" {
  value = {
    instances = data.aws_instances.byu_590r.ids
    elastic_ips = data.aws_eips.byu_590r.allocation_ids
    s3_buckets = local.byu_s3_buckets
    security_groups = data.aws_security_groups.byu_590r.ids
  }
  description = "Resources that will be destroyed"
}

# Destroy EC2 instances
resource "null_resource" "destroy_instances" {
  count = var.confirm_destroy ? length(data.aws_instances.byu_590r.ids) : 0
  
  provisioner "local-exec" {
    command = "aws ec2 terminate-instances --instance-ids ${join(" ", data.aws_instances.byu_590r.ids)} --region ${var.aws_region}"
  }
  
  depends_on = [data.aws_instances.byu_590r]
}

# Release Elastic IPs
resource "null_resource" "release_eips" {
  count = var.confirm_destroy ? length(data.aws_eips.byu_590r.allocation_ids) : 0
  
  provisioner "local-exec" {
    command = "aws ec2 release-address --allocation-id ${join(" ", data.aws_eips.byu_590r.allocation_ids)} --region ${var.aws_region}"
  }
  
  depends_on = [data.aws_eips.byu_590r]
}

# Delete S3 buckets (simplified - manual cleanup required)
resource "null_resource" "delete_s3_buckets" {
  count = var.confirm_destroy ? 0 : 0  # Disabled for now
  
  provisioner "local-exec" {
    command = "echo 'S3 bucket cleanup disabled - manual cleanup required'"
  }
}

# Delete security groups
resource "null_resource" "delete_security_groups" {
  count = var.confirm_destroy ? length(data.aws_security_groups.byu_590r.ids) : 0
  
  provisioner "local-exec" {
    command = "aws ec2 delete-security-group --group-id ${join(" ", data.aws_security_groups.byu_590r.ids)} --region ${var.aws_region}"
  }
  
  depends_on = [data.aws_security_groups.byu_590r]
}

# Clean up configuration file
resource "null_resource" "cleanup_config" {
  count = var.confirm_destroy ? 1 : 0
  
  provisioner "local-exec" {
    command = "rm -f ${path.module}/../.server-config"
  }
}
