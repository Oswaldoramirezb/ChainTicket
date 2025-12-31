# ==================================================
# Lambda Function para Backend API
# ==================================================

# Zip del código del backend
data "archive_file" "backend_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend"
  output_path = "${path.module}/backend_lambda.zip"
}

# Lambda Function
resource "aws_lambda_function" "backend_api" {
  filename         = data.archive_file.backend_lambda.output_path
  function_name    = "${var.project_name}-backend-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda.handler"
  source_code_hash = data.archive_file.backend_lambda.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      # AWS (Lambda ya tiene permisos via IAM Role, pero por si acaso)
      AWS_REGION_CUSTOM               = var.aws_region
      DYNAMODB_TABLE_BUSINESS_METRICS = aws_dynamodb_table.business_metrics.name
      DYNAMODB_TABLE_SALES_HISTORY    = aws_dynamodb_table.sales_history.name
      DYNAMODB_TABLE_AI_CONVERSATIONS = aws_dynamodb_table.ai_conversations.name

      # Bedrock
      BEDROCK_MODEL_ID = "amazon.titan-text-express-v1:0"

      # Movement
      MOVEMENT_RPC_URL        = "https://aptos.testnet.porto.movementlabs.xyz/v1"
      MOVEMENT_INDEXER_URL    = "https://indexer.testnet.porto.movementnetwork.xyz/v1/graphql"
      CONTRACT_MODULE_ADDRESS = "0x0a10dde9540e854e79445a37ed6636086128cfc4d13638077e983a14a4398056"

      # Privy (secret para verificar tokens)
      PRIVY_APP_ID     = var.privy_app_id
      PRIVY_APP_SECRET = var.privy_app_secret

      # x402 Payments
      PAYMENT_RECEIVER_ADDRESS = var.payment_receiver_address
    }
  }

  tags = {
    Name = "ChainTicket Backend API"
  }
}

# ==================================================
# IAM Role para Lambda
# ==================================================

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Permisos básicos de Lambda (logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Permisos para DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-lambda-dynamodb"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.business_metrics.arn,
          "${aws_dynamodb_table.business_metrics.arn}/index/*",
          aws_dynamodb_table.sales_history.arn,
          "${aws_dynamodb_table.sales_history.arn}/index/*",
          aws_dynamodb_table.ai_conversations.arn,
          "${aws_dynamodb_table.ai_conversations.arn}/index/*"
        ]
      }
    ]
  })
}

# Permisos para Bedrock
resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${var.project_name}-lambda-bedrock"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-*"
        ]
      }
    ]
  })
}

# ==================================================
# API Gateway HTTP API
# ==================================================

resource "aws_apigatewayv2_api" "backend" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"] # En producción, limitar a tu dominio
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Payment", "X-Buyer-Address"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 7
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.backend.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.backend_api.invoke_arn
  integration_method = "POST"
}

# Route catch-all
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Permiso para API Gateway invocar Lambda
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*"
}
