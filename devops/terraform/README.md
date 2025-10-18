# Terraform Infrastructure as Code

This directory contains Terraform configurations for managing the BYU 590R application infrastructure on AWS.

## Overview

The Terraform configuration replicates the functionality of the bash scripts in `../bash/` but provides:

- **Infrastructure as Code**: Declarative configuration management
- **State Management**: Tracks resource dependencies and state
- **Plan/Apply Workflow**: Preview changes before applying
- **Resource Relationships**: Automatic dependency resolution
- **Rollback Support**: Easy resource cleanup and recreation

## Directory Structure

```
terraform/
├── main.tf           # Main infrastructure configuration
├── variables.tf      # Variable definitions
├── destroy.tf        # Teardown configuration
├── user_data.sh      # EC2 instance setup script
├── server_config.tpl # Server configuration template
└── README.md         # This documentation
```

## Prerequisites

- **Terraform**: Version 1.0 or higher
- **AWS CLI**: Configured with appropriate credentials
- **AWS IAM Permissions**: Same as bash scripts (EC2, S3, Elastic IP)

## Usage

### Setup Infrastructure

```bash
# Using Make (recommended)
make aws-setup-tf

# Or directly
cd devops/terraform
terraform init
terraform plan
terraform apply
```

### Teardown Infrastructure

```bash
# Using Make (recommended)
make aws-teardown-tf

# Or directly
cd devops/terraform
terraform destroy
```

### Direct Terraform Usage

```bash
cd devops/terraform

# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy
```

## Infrastructure Components

### EC2 Instance

- **AMI**: Latest Ubuntu 22.04 LTS
- **Instance Type**: t2.micro (configurable)
- **Key Pair**: Uses existing key pair
- **User Data**: Automated server setup script

### Security Group

- **SSH (22)**: For server access
- **HTTP (80)**: For frontend application
- **HTTPS (443)**: For secure connections
- **Backend API (4444)**: For Laravel API

### Elastic IP

- **Static IP**: For consistent server access
- **Auto-association**: Automatically associated with EC2 instance

### S3 Bucket

- **Unique naming**: Timestamp + random suffix
- **Tagging**: Properly tagged for identification
- **Public access**: Blocked for security

## Configuration

### Environment Variables

The Terraform scripts respect the same environment variables as bash scripts:

```bash
# .env file in devops root
AWS_REGION=us-west-1
PROJECT_NAME=byu-590r
KEY_NAME=byu-590r
```

### Variables

Key Terraform variables (with defaults):

- `aws_region`: AWS region (default: us-west-1)
- `project_name`: Project name for resource naming (default: byu-590r)
- `key_name`: EC2 Key Pair name (default: byu-590r)
- `instance_type`: EC2 instance type (default: t2.micro)

## Outputs

Terraform provides structured outputs:

- `instance_id`: EC2 Instance ID
- `elastic_ip`: Elastic IP address
- `ec2_host`: Primary host address
- `s3_bucket`: S3 bucket name
- `security_group_id`: Security Group ID

## State Management

- **Local State**: Stored in `terraform.tfstate`
- **State Locking**: Prevents concurrent modifications
- **Backup**: Automatic state backup on changes

## Comparison with Bash Scripts

| Feature               | Bash Scripts            | Terraform                     |
| --------------------- | ----------------------- | ----------------------------- |
| **Setup**             | `make aws-setup`        | `make aws-setup-tf`           |
| **Teardown**          | `make aws-teardown`     | `make aws-teardown-tf`        |
| **State Management**  | Manual (.server-config) | Automatic (terraform.tfstate) |
| **Dependencies**      | Manual ordering         | Automatic resolution          |
| **Rollback**          | Manual cleanup          | `terraform destroy`           |
| **Plan Changes**      | No preview              | `terraform plan`              |
| **Resource Tracking** | Manual                  | Automatic                     |

## Best Practices

1. **Always run `terraform plan`** before applying changes
2. **Use version control** for Terraform configurations
3. **Keep state files secure** (consider remote state for teams)
4. **Use variables** for environment-specific values
5. **Tag resources** for proper identification and cleanup

## Troubleshooting

### Common Issues

1. **State Lock**: If Terraform is interrupted, state may be locked

   ```bash
   terraform force-unlock <lock-id>
   ```

2. **Resource Conflicts**: If resources exist outside Terraform

   ```bash
   terraform import aws_instance.example i-1234567890abcdef0
   ```

3. **Permission Errors**: Ensure AWS credentials have required permissions

### Debugging

- **Enable Debug Logging**: `export TF_LOG=DEBUG`
- **Check State**: `terraform show`
- **Validate Configuration**: `terraform validate`

## Migration from Bash Scripts

To migrate from bash scripts to Terraform:

1. **Backup existing resources**: Document current infrastructure
2. **Run Terraform setup**: `make aws-setup-tf`
3. **Verify functionality**: Test application deployment
4. **Clean up bash resources**: `make aws-teardown` (if needed)

Both approaches can coexist, but it's recommended to use one consistently for a given environment.
