export const environment = {
  production: false,

  // keep your existing backends as-is
  apiBase:  'https://f91d-34-90-35-83.ngrok-free.app', // your summary/quiz/qa service
  apiBase2: 'http://127.0.0.1:8000',                    // your TTS/lesson JSON service

  // NEW: Spring Boot + Keycloak (port 8081)
  backendBase: 'http://localhost:8081',
  kc: {
    url: 'http://localhost:8083',
    realm: 'etudeai',
    clientId: 'Front'
  }
};







