# Kybern TaskHub — End-to-End DevOps Capstone

A full-stack project management application deployed to **Amazon EKS** using Docker, Terraform, Kubernetes, Amazon ECR, GitHub Actions, and Kubernetes Metrics Server.

This repository began as application source code and was extended with containerization, infrastructure as code, Kubernetes manifests, and an automated CI/CD pipeline.

## Application stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | NestJS, Node.js, TypeScript |
| Database | MongoDB 8 |
| Local containers | Docker and Docker Compose |
| Infrastructure as code | Terraform |
| Cloud infrastructure | AWS VPC, subnets, IAM, EKS, EBS, ALB |
| Container registry | Amazon ECR |
| CI/CD | GitHub Actions with AWS OIDC |
| Resource monitoring | Kubernetes Metrics Server |

## Architecture

```text
Browser
  |
  v
AWS Application Load Balancer (HTTP :80)
  |
  v
Kubernetes ALB Ingress
  |
  v
Next.js frontend Service (:3000) -> frontend Deployment
  |                                      |
  +-- /api rewrite ---------------------+
  |
  v
NestJS backend Service (:3001) -> backend Deployment
  |
  v
MongoDB Service (:27017) -> MongoDB StatefulSet
                               |
                               v
                     EBS-backed persistent volume
```

The public ALB currently routes `/` to the frontend. Next.js forwards `/api` requests to the internal backend service. The backend handles authentication and application operations, including projects and tasks. MongoDB stores application data on persistent storage.

### Delivery pipeline

```text
Pull request checks / push to GitHub main
              |
              v
         GitHub Actions
              |
      +-------+-------+
      |               |
      v               v
 Frontend checks   Backend checks
 lint + build      unit tests + build
      |               |
      +-------+-------+
              |
              v
       Deploy job (push only)
              |
        GitHub OIDC -> AWS IAM role
              |
        Docker builds -> Amazon ECR
              |
       Images tagged with commit SHA
              |
        kubectl set image on EKS
              |
        kubectl rollout status
```

## Repository layout

```text
taskhub/
├── .github/workflows/ci.yml     # CI/CD workflow
├── frontend/                    # Next.js application and Dockerfile
├── backend/                     # NestJS API and Dockerfile
├── docker-compose.yml           # Local multi-service environment
├── k8s/                         # Deployments, Services, Ingress, PVC, StatefulSet
├── terraform/                   # AWS infrastructure as code
├── docs/                        # Original application documentation
└── README.md
```

## 1. Containerization and local development

The frontend and backend are packaged as Docker images using multi-stage builds. Their production images use a non-root runtime user. Docker Compose connects the frontend, backend, and MongoDB locally.

```bash
docker compose up -d --build
docker compose ps
```

Frontend port: `3000`; backend port: `3001`; MongoDB port: `27017` (internal).

## 2. Terraform and AWS infrastructure

Terraform configuration provisions or configures the VPC, public/private subnets, routing, Internet Gateway, NAT Gateway, IAM roles, EKS cluster and node group, EBS CSI integration, and supporting AWS resources. AWS Load Balancer Controller IAM configuration is also included.

```bash
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
```

**Cost caution:** An EKS cluster, NAT Gateway, Application Load Balancer, and EC2 worker nodes can incur charges even when application traffic is low. Review AWS billing and clean up resources when no longer needed.

**Security:** Never commit `terraform.tfstate`, state backups, `.terraform/`, credentials, or secret files. The Terraform state files in this working directory were verified as not tracked by Git on October 19, 2026.

## 3. Kubernetes on EKS

- **Cluster:** `taskhub-eks`
- **Region:** `us-east-1`
- **Namespace:** `taskhub`
- **Frontend:** Kubernetes Deployment and ClusterIP Service on port `3000`
- **Backend:** Kubernetes Deployment and ClusterIP Service on port `3001`
- **MongoDB:** StatefulSet, ClusterIP Service on port `27017`, and EBS-backed PersistentVolumeClaim
- **Public entry point:** AWS Application Load Balancer managed through Kubernetes Ingress

Useful verification commands:

```bash
kubectl get nodes
kubectl get deployments,pods,services -n taskhub
kubectl get ingress,pvc -n taskhub
kubectl describe deployment frontend -n taskhub
```

## 4. GitHub Actions CI/CD

Workflow: `.github/workflows/ci.yml`.

1. **Frontend job:** dependency installation, lint, and production build.
2. **Backend job:** dependency installation, unit tests, and production build.
3. **Deploy job:** runs after both checks succeed on pushes to `main`. It assumes a dedicated AWS IAM role using GitHub OIDC, builds and pushes both images to ECR tagged with the Git commit SHA, updates the Kubernetes Deployments, and waits for successful rollouts.

OIDC avoids storing long-lived AWS access keys in GitHub. Kubernetes RBAC limits the deployment identity to updating the required frontend and backend Deployments in the `taskhub` namespace.

**Deployment trigger:** Pull requests run CI checks. Pushes to `main` automatically deploy to Amazon EKS after the checks pass, using GitHub Actions and AWS OIDC authentication.

## 5. Monitoring and troubleshooting

Kubernetes Metrics Server is installed in `kube-system`, and its Metrics API was verified available.

```bash
kubectl top nodes
kubectl top pods -n taskhub
kubectl logs deployment/frontend -n taskhub --tail=50
kubectl logs deployment/backend -n taskhub --tail=50
kubectl get events -n taskhub --sort-by=.metadata.creationTimestamp
```

Metrics Server provides current CPU and memory measurements; it does **not** provide long-term metric retention, application dashboards, or alerting. Prometheus/Grafana and automated alerts are potential future improvements.


### Automated health monitoring and alerting

TaskHub uses a Kubernetes CronJob to check application health every five minutes.

- Bash checks the frontend and backend HTTP responses.
- Python generates critical JSON alerts when a check fails.
- Docker packages the monitoring scripts.
- Amazon ECR stores the monitoring image.
- Kubernetes runs the monitoring container automatically.

Healthy checks exit successfully. Failed checks produce alerts in Kubernetes logs.

Both successful and failed health checks were tested on October 19, 2026.
Automatic monitoring was verified again on October 20, 2026.

External alert notifications are not yet configured.

## 6. Testing and verification evidence

The following results were observed on **October 19, 2026**:

| Check | Observed result |
|---|---|
| Backend unit tests | 13 passing |
| Frontend lint and production build | Passing |
| GitHub Actions workflow | Frontend, backend, and deploy jobs succeeded |
| EKS frontend Deployment | `1/1` Ready |
| EKS backend Deployment | `1/1` Ready |
| MongoDB pod | `1/1` Running |
| Public homepage | HTTP `200` |
| Unauthenticated `/api/projects` | HTTP `401`, expected for a protected endpoint |
| Metrics Server Deployment | `1/1` Ready |
| Metrics API | Available |
| `kubectl top` | Node and application pod metrics returned |
| Browser project workflow | Signed-in project listing and new project visible in screenshots |

Both deployed images were tagged with commit:

`eb60b5ae618df219c541ccfdbce6665cdf8cd901`

Public ALB endpoint at the time of verification:

http://k8s-taskhub-taskhubf-bf65db50f2-1303020863.us-east-1.elb.amazonaws.com/

This is an AWS-generated hostname and can change if the ALB is recreated. HTTPS is not yet configured.

## 7. Challenges and resolutions

**AWS worker node eligibility:** An earlier EC2 instance selection was rejected under account eligibility restrictions. Node configuration was adjusted and the cluster eventually reached a healthy state.

**MongoDB persistent storage:** Configured the EBS CSI driver, storage class, and PVC, and verified volume provisioning.

**GitHub OIDC trust failure:** The first deploy attempt failed with `sts:AssumeRoleWithWebIdentity`. CloudTrail revealed that the OIDC subject contained immutable repository and owner IDs. Updating the IAM trust policy to match the actual subject allowed the rerun to succeed.

**Least-privilege deployment:** Configured an EKS `aws-auth` identity mapping and namespace-scoped Role/RoleBinding. Verified that deployment patching was allowed and deletion was denied.

**Metrics API unavailable:** Installed Metrics Server, verified its pod was Ready, and confirmed `kubectl top` returned live readings.

**Rolling deployment warning:** A readiness warning appeared for an old backend pod while it was being terminated. The replacement backend started successfully and remained Ready.

## 8. Security considerations and next steps

Implemented: non-root containers, multi-stage builds, IAM roles, OIDC for CI/CD, Kubernetes RBAC, internal ClusterIP services, and commit-SHA image tags.

Before treating this as a production service, additional work is recommended: HTTPS with a custom domain and ACM certificate, secure application secret management, historical metrics and alerts, automated end-to-end tests, resource requests/limits review, and backup/recovery planning.

## 9. Supporting application documentation

- [Local setup](docs/Setup.md)
- [Application architecture](docs/Architecture.md)
- [API overview](docs/API.md)
- [Folder structure](docs/FolderStructure.md)

## Outcome

This capstone demonstrates a functioning delivery path from source control to a publicly accessible Kubernetes application: GitHub Actions validates the code, builds and pushes immutable-versioned images to ECR, deploys them to EKS, and verifies rollouts. Kubernetes Metrics Server, logs, and events provide initial operational visibility.
