# ==================================================
# AWS Amplify App Configuration
# ==================================================

resource "aws_amplify_app" "chainticket" {
  name       = "${var.project_name}-${var.environment}"
  repository = var.github_repo_url  # ej: "https://github.com/tu-usuario/chainticket"
  
  # OAuth token de GitHub (guardar en terraform.tfvars o secrets)
  access_token = var.github_access_token
  
  # Build settings (tu configuración actual)
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - 'npm ci --cache .npm --prefer-offline --prefix client'
        build:
          commands:
            - 'npm run build --prefix client'
      artifacts:
        baseDirectory: client/dist
        files:
          - '**/*'
      cache:
        paths:
          - 'client/node_modules/**/*'
  EOT

  # Variables de entorno del FRONTEND (Vite)
  environment_variables = {
    # Movement Network
    VITE_MOVEMENT_RPC_URL     = "https://aptos.testnet.porto.movementlabs.xyz/v1"
    VITE_MOVEMENT_INDEXER_URL = "https://indexer.testnet.porto.movementnetwork.xyz/v1/graphql"
    VITE_CONTRACT_ADDRESS     = "0x0a10dde9540e854e79445a37ed6636086128cfc4d13638077e983a14a4398056"
    
    # Privy (obtener de Privy Dashboard)
    VITE_PRIVY_APP_ID = var.privy_app_id
    
    # API Backend
    VITE_API_URL = var.backend_api_url  # URL del backend (puede ser EC2/Lambda)
    
    # Build optimization
    NODE_OPTIONS = "--max-old-space-size=4096"
  }

  # IAM role para acceder a recursos AWS
  iam_service_role_arn = aws_iam_role.amplify_service_role.arn

  # Auto-deploy cuando hay push
  enable_auto_branch_creation = false
  enable_branch_auto_build    = true
  enable_branch_auto_deletion = false

  tags = {
    Name        = "ChainTicket Amplify App"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==================================================
# Amplify Branch (main/develop)
# ==================================================

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.chainticket.id
  branch_name = var.git_branch  # "main" o "develop"
  
  enable_auto_build = true
  
  # Variables específicas de esta rama (opcional)
  environment_variables = {
    ENV = var.environment
  }

  tags = {
    Name = "Main Branch"
  }
}

# ==================================================
# IAM Role para Amplify
# ==================================================

resource "aws_iam_role" "amplify_service_role" {
  name = "${var.project_name}-amplify-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "Amplify Service Role"
  }
}

# Attach policy para que Amplify pueda hacer builds
resource "aws_iam_role_policy_attachment" "amplify_backend_deployment" {
  role       = aws_iam_role.amplify_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

# ==================================================
# Domain Association (opcional)
# ==================================================

resource "aws_amplify_domain_association" "chainticket_domain" {
  count = var.custom_domain != "" ? 1 : 0
  
  app_id      = aws_amplify_app.chainticket.id
  domain_name = var.custom_domain

  # Subdomain config
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.environment == "prod" ? "" : var.environment
  }

  # Wait for DNS propagation
  wait_for_verification = true
}
