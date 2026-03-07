import { google, Auth } from "googleapis"

let _auth: Auth.GoogleAuth | null = null

export function getGcpAuth(): Auth.GoogleAuth {
  if (_auth) return _auth

  const keyJson = process.env.GCP_SA_KEY_JSON
  const projectId = process.env.GCP_PROJECT_ID

  if (!projectId) throw new Error("Missing GCP_PROJECT_ID environment variable")

  if (keyJson) {
    // Service account key provided as JSON string in env
    const credentials = JSON.parse(keyJson)
    _auth = new google.auth.GoogleAuth({
      credentials,
      projectId,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/compute.readonly",
        "https://www.googleapis.com/auth/logging.read",
        "https://www.googleapis.com/auth/cloud-platform.read-only",
      ],
    })
  } else {
    // Fall back to Application Default Credentials (gcloud auth, Workload Identity, etc.)
    _auth = new google.auth.GoogleAuth({
      projectId,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/compute.readonly",
        "https://www.googleapis.com/auth/logging.read",
        "https://www.googleapis.com/auth/cloud-platform.read-only",
      ],
    })
  }

  return _auth
}

export function getProjectId(): string {
  const id = process.env.GCP_PROJECT_ID
  if (!id) throw new Error("Missing GCP_PROJECT_ID")
  return id
}
