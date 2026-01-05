pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify structure') {
      steps {
        sh '''
          echo "Repo root:"
          ls -la
          echo "Backend:"
          ls -la backend || true
          echo "Frontend:"
          ls -la frontend || true
          echo "Terraform:"
          ls -la terraform || true
        '''
      }
    }
  }
}
