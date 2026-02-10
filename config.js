const defaultAppConfig = {
  fixedModel: "gpt-5.2",
  globalContextDocument: "",
  systemPromptPrefix: "You are a professional job search strategist. Follow requested structure strictly and return markdown only.",
  backendGenerateEndpoint: "/api/generate"
};

const deploymentEnvConfig = window.__JOB_ASSISTANT_ENV_CONFIG__ || {};

window.appConfig = {
  ...defaultAppConfig,
  ...deploymentEnvConfig
};
