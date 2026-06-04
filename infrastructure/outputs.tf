output "alb_dns_name" {
  description = "Public URL of the load balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (private)"
  value       = aws_db_instance.postgres.address
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint (private)"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "vpc_id" {
  value = aws_vpc.main.id
}
