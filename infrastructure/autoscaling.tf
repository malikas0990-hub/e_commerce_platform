# ===== Launch template: boots an instance running the backend container =====
resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project}-lt-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(<<-EOT
    #!/bin/bash
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    docker run -d --restart always -p 5000:5000 \
      -e DB_HOST=${aws_db_instance.postgres.address} \
      -e DB_USER=${var.db_username} \
      -e DB_PASSWORD=${var.db_password} \
      -e DB_NAME=clothing_shop \
      -e REDIS_HOST=${aws_elasticache_cluster.redis.cache_nodes[0].address} \
      -e NODE_ENV=production \
      ${var.backend_image}
  EOT
  )

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${var.project}-backend" }
  }
}

# ===== Auto Scaling Group (private subnets, behind ALB) =====
resource "aws_autoscaling_group" "backend" {
  name                = "${var.project}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"

  min_size         = var.asg_min
  max_size         = var.asg_max
  desired_capacity = var.asg_desired

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project}-backend"
    propagate_at_launch = true
  }
}

# ===== Scaling policies =====
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project}-scale-up"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 2
  cooldown               = 120
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project}-scale-down"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 120
}

# ===== CloudWatch alarms drive the scaling (high-load / stress condition) =====
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
  dimensions          = { AutoScalingGroupName = aws_autoscaling_group.backend.name }
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.project}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 25
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]
  dimensions          = { AutoScalingGroupName = aws_autoscaling_group.backend.name }
}
