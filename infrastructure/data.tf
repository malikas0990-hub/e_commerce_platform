data "aws_availability_zones" "available" {
  state = "available"
}

# Latest Amazon Linux 2023 AMI for the ASG instances
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}
