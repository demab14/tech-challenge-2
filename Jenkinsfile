pipeline {
  agent any

  environment {
    AWS_REGION   = 'eu-west-2'
    CLUSTER_NAME = 'techchallenge-cluster'
    FRONTEND_SVC = 'frontend'
    BACKEND_SVC  = 'backend'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_SHA = sh(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim()
        }
      }
    }

    stage('Build & Push Images') {
      steps {
        sh '''
          set -e

          ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
          ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

          aws ecr get-login-password --region ${AWS_REGION} \
            | docker login --username AWS --password-stdin ${ECR_BASE}

          # ---- FRONTEND ----
          docker build -t techchallenge-frontend:${GIT_SHA} ./frontend
          docker tag techchallenge-frontend:${GIT_SHA} ${ECR_BASE}/techchallenge-frontend:${GIT_SHA}
          docker push ${ECR_BASE}/techchallenge-frontend:${GIT_SHA}

          # ---- BACKEND ----
          docker build -t techchallenge-backend:${GIT_SHA} ./backend
          docker tag techchallenge-backend:${GIT_SHA} ${ECR_BASE}/techchallenge-backend:${GIT_SHA}
          docker push ${ECR_BASE}/techchallenge-backend:${GIT_SHA}
        '''
      }
    }

    stage('Deploy to ECS') {
      steps {
        sh '''
          set -e

          ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
          ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

          # ======================
          # FRONTEND
          # ======================
          FRONTEND_TASKDEF_ARN=$(aws ecs describe-services \
            --region ${AWS_REGION} \
            --cluster ${CLUSTER_NAME} \
            --services ${FRONTEND_SVC} \
            --query 'services[0].taskDefinition' \
            --output text)

          aws ecs describe-task-definition \
            --region ${AWS_REGION} \
            --task-definition "${FRONTEND_TASKDEF_ARN}" \
            --query 'taskDefinition' > /tmp/frontend-taskdef.json

          cat /tmp/frontend-taskdef.json | jq '
            del(.taskDefinitionArn,.revision,.status,.requiresAttributes,.compatibilities,.registeredAt,.registeredBy)
            | .containerDefinitions[0].image = "'"${ECR_BASE}/techchallenge-frontend:${GIT_SHA}"'"
          ' > /tmp/frontend-taskdef-new.json

          NEW_FRONTEND_TASKDEF=$(aws ecs register-task-definition \
            --region ${AWS_REGION} \
            --cli-input-json file:///tmp/frontend-taskdef-new.json \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          aws ecs update-service \
            --region ${AWS_REGION} \
            --cluster ${CLUSTER_NAME} \
            --service ${FRONTEND_SVC} \
            --task-definition "${NEW_FRONTEND_TASKDEF}" \
            --force-new-deployment

          # ======================
          # BACKEND
          # ======================
          BACKEND_TASKDEF_ARN=$(aws ecs describe-services \
            --region ${AWS_REGION} \
            --cluster ${CLUSTER_NAME} \
            --services ${BACKEND_SVC} \
            --query 'services[0].taskDefinition' \
            --output text)

          aws ecs describe-task-definition \
            --region ${AWS_REGION} \
            --task-definition "${BACKEND_TASKDEF_ARN}" \
            --query 'taskDefinition' > /tmp/backend-taskdef.json

          cat /tmp/backend-taskdef.json | jq '
            del(.taskDefinitionArn,.revision,.status,.requiresAttributes,.compatibilities,.registeredAt,.registeredBy)
            | .containerDefinitions[0].image = "'"${ECR_BASE}/techchallenge-backend:${GIT_SHA}"'"
          ' > /tmp/backend-taskdef-new.json

          NEW_BACKEND_TASKDEF=$(aws ecs register-task-definition \
            --region ${AWS_REGION} \
            --cli-input-json file:///tmp/backend-taskdef-new.json \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          aws ecs update-service \
            --region ${AWS_REGION} \
            --cluster ${CLUSTER_NAME} \
            --service ${BACKEND_SVC} \
            --task-definition "${NEW_BACKEND_TASKDEF}" \
            --force-new-deployment

          # ======================
          # WAIT FOR STABILITY
          # ======================
          aws ecs wait services-stable --region ${AWS_REGION} --cluster ${CLUSTER_NAME} --services ${FRONTEND_SVC}
          aws ecs wait services-stable --region ${AWS_REGION} --cluster ${CLUSTER_NAME} --services ${BACKEND_SVC}
        '''
      }
    }
  }
}


