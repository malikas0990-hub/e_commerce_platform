variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "clothing-ecommerce"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "asg_min" {
  type    = number
  default = 2
}

variable "asg_max" {
  type    = number
  default = 10
}

variable "asg_desired" {
  type    = number
  default = 2
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "backend_image" {
  description = "Container image for the backend"
  type        = string
  default     = "clothing-backend:latest"
}
