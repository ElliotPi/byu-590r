terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Random ID for unique resource naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# VPC and Networking (optional - can use default VPC)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group
resource "aws_security_group" "byu_590r" {
  name_prefix = "${var.project_name}-"
  description = "Security group for BYU 590R application"
  vpc_id      = data.aws_vpc.default.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # Backend API access
  ingress {
    from_port   = 4444
    to_port     = 4444
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

# Elastic IP
resource "aws_eip" "byu_590r" {
  domain = "vpc"
  
  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

# EC2 Instance
resource "aws_instance" "byu_590r_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name
  vpc_security_group_ids = [aws_security_group.byu_590r.id]
  subnet_id     = data.aws_subnets.default.ids[0]

  # User data script for server setup
  user_data = templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
    apache_log_dir = "/var/log/apache2"
  })

  tags = {
    Name    = "${var.project_name}-server"
    Project = var.project_name
  }
}

# Associate Elastic IP with instance
resource "aws_eip_association" "byu_590r" {
  instance_id   = aws_instance.byu_590r_server.id
  allocation_id = aws_eip.byu_590r.id
}

# S3 Bucket
resource "aws_s3_bucket" "byu_590r" {
  bucket = "${var.project_name}-${formatdate("YYYYMMDDhhmm", timestamp())}-${random_id.bucket_suffix.hex}"

  tags = {
    Name    = "${var.project_name}-bucket"
    Project = var.project_name
  }
}

resource "aws_s3_bucket_public_access_block" "byu_590r" {
  bucket = aws_s3_bucket.byu_590r.id

  block_public_acls       = true
  block_public_policy      = true
  ignore_public_acls       = true
  restrict_public_buckets  = true
}


# Generate server configuration file
resource "local_file" "server_config" {
  content = templatefile("${path.module}/server_config.tpl", {
    instance_id    = aws_instance.byu_590r_server.id
    instance_ip    = aws_instance.byu_590r_server.public_ip
    elastic_ip     = aws_eip.byu_590r.public_ip
    allocation_id = aws_eip.byu_590r.id
    ec2_host      = aws_eip.byu_590r.public_ip
    s3_bucket     = aws_s3_bucket.byu_590r.bucket
  })
  filename = "${path.module}/../.server-config"
}
