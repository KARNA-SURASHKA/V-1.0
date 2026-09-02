// ============================================================
// API CONFIGURATION
// ============================================================

// Keep the frontend and backend on the same loopback hostname.
// Backend:
//   uvicorn app.main:app --reload
//
// Usually available at:
//   http://127.0.0.1:8000
//
// You can override this with VITE_API_BASE in .env if needed.

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// ============================================================
// SESSION / AUTH HELPERS
// ============================================================

const getToken = () => {
  return sessionStorage.getItem("kt_token");
};

const getSession = () => {
  try {
    return JSON.parse(
      sessionStorage.getItem("kt_session") || "null"
    );
  } catch {
    return null;
  }
};

const setSession = (session) => {
  if (session === null || session === undefined) {
    sessionStorage.removeItem("kt_session");
    sessionStorage.removeItem("kt_token");
    return;
  }

  sessionStorage.setItem(
    "kt_session",
    JSON.stringify(session)
  );

  const token =
    session?.access_token ||
    session?.token ||
    session?.accessToken ||
    session?.data?.access_token ||
    session?.data?.token ||
    null;

  if (token) {
    sessionStorage.setItem(
      "kt_token",
      String(token)
    );
  }
};

const clearSession = () => {
  sessionStorage.removeItem("kt_session");
  sessionStorage.removeItem("kt_token");
};

const logout = () => {
  clearSession();
};

// ============================================================
// ERROR HANDLING
// ============================================================

const getErrorMessage = (detail) => {
  if (!detail) {
    return "Request failed.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item) {
          return "";
        }

        if (typeof item === "string") {
          return item;
        }

        if (item.msg) {
          return String(item.msg);
        }

        if (item.message) {
          return String(item.message);
        }

        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join(" ");
  }

  if (typeof detail === "object") {
    if (detail.msg) {
      return String(detail.msg);
    }

    if (detail.message) {
      return String(detail.message);
    }

    if (detail.detail) {
      return getErrorMessage(detail.detail);
    }

    try {
      return JSON.stringify(detail);
    } catch {
      return "Request failed.";
    }
  }

  return String(detail);
};

// ============================================================
// URL BUILDER
// ============================================================

const buildUrl = (endpoint, params) => {
  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();

    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
};

// ============================================================
// GENERIC REQUEST
// ============================================================

const request = async (
  endpoint,
  options = {}
) => {
  const {
    method = "GET",
    body = undefined,
    params = undefined,
    auth = true,
  } = options;

  const url = buildUrl(endpoint, params);

  const headers = {
    Accept: "application/json",
  };

  // ----------------------------------------------------------
  // BODY HANDLING
  // ----------------------------------------------------------

  let requestBody = undefined;

  if (body !== undefined && body !== null) {
    // IMPORTANT:
    // FormData must NOT be JSON.stringify()-ed and must NOT
    // receive an application/json Content-Type.
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  // ----------------------------------------------------------
  // AUTHORIZATION
  // ----------------------------------------------------------

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  console.log(
    `[API REQUEST] ${method} ${url}`,
    {
      authenticated: auth && Boolean(getToken()),
      hasToken: Boolean(getToken()),
    }
  );

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------

  let response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });
  } catch (error) {
    console.error(
      `[API NETWORK ERROR] ${method} ${url}`,
      error
    );

    throw new Error(
      `Cannot connect to backend at ${API_BASE}. ` +
      `Make sure FastAPI/Uvicorn is running.`
    );
  }

  // ----------------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------------

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  console.log(
    `[API RESPONSE] ${response.status} ${method} ${url}`,
    data
  );

  // ----------------------------------------------------------
  // HTTP ERRORS
  // ----------------------------------------------------------

  if (!response.ok) {
    let message = getErrorMessage(
      data?.detail ?? data
    );

    if (
      !message ||
      message === "[object Object]"
    ) {
      message =
        response.statusText ||
        "Request failed.";
    }

    // Authentication error
    if (
      response.status === 401 &&
      auth
    ) {
      clearSession();

      throw new Error(
        "Your session has expired or is invalid. Please log in again."
      );
    }

    // Permission error
    if (response.status === 403) {
      throw new Error(
        message ||
          "You do not have permission to access this resource."
      );
    }

    // Not found
    if (response.status === 404) {
      throw new Error(
        `API endpoint not found: ${endpoint}`
      );
    }

    // Server error
    if (response.status >= 500) {
      throw new Error(
        `Backend error ${response.status}: ${message}`
      );
    }

    throw new Error(
      `${message} (HTTP ${response.status})`
    );
  }

  return data;
};

// ============================================================
// EMPTY HOME RELIEF RESPONSE
// ============================================================

const emptyHomeReliefResponse = () => ({
  query: "",
  context: {
    conditions: [],
    pregnancy: false,
    breastfeeding: false,
    age: null,
  },
  recommended: [],
  use_with_caution: [],
  restricted: [],
  alternatives: [],
  total_found: 0,
  safety_filter_applied: false,
});

// ============================================================
// API
// ============================================================

const api = {

  // ==========================================================
  // AUTH
  // ==========================================================

  login: async (
    username,
    password,
    role
  ) => {
    return request(
      "/auth/login",
      {
        method: "POST",
        auth: false,
        body: {
          username,
          password,
          role,
        },
      }
    );
  },

  getSession,

  getToken,

  setSession,

  clearSession,

  logout,

  // ==========================================================
  // LOCATIONS
  // ==========================================================

  getStates: async () => {
    return request(
      "/locations/states"
    );
  },

  getDistricts: async (
    stateId
  ) => {
    return request(
      `/locations/districts/${stateId}`
    );
  },

  getTaluks: async (
    districtId
  ) => {
    return request(
      `/locations/taluks/${districtId}`
    );
  },

  // ==========================================================
  // USER DASHBOARD
  // ==========================================================

  getDashboard: async (
    talukId
  ) => {
    return request(
      `/dashboard/${talukId}`
    );
  },

  getSpreadMap: async (
    talukId
  ) => {
    return request(
      `/spread-map/${talukId}`
    );
  },

  getAdvice: async (
    talukId
  ) => {
    return request(
      `/advice/${talukId}`
    );
  },

  getNotifications: async (
    talukId
  ) => {
    return request(
      `/notifications/${talukId}`
    );
  },

  // ==========================================================
  // AI MEDICAL CHAT
  // ==========================================================

  medicalChat: async ({
    message,
    conversation = [],
    location = null,
  }) => {
    return request(
      "/medical-chat",
      {
        method: "POST",
        body: {
          message,
          conversation,
          location,
        },
      }
    );
  },

  // ==========================================================
  // DISEASES
  // ==========================================================

  getDiseases: async () => {
    return request(
      "/medical/diseases"
    );
  },

  getMedicalDiseases: async () => {
    return request(
      "/medical/diseases"
    );
  },

  // ==========================================================
  // EMERGING DISEASES
  // ==========================================================

  getEmergingDiseases: async () => {
    return request(
      "/medical/emerging"
    );
  },

  getMedicalEmergingDiseases: async () => {
    return request(
      "/medical/emerging"
    );
  },

  // ==========================================================
  // MEDICAL SUPERVISOR OVERVIEW
  // ==========================================================

  getMedicalOverview: async (
    talukId
  ) => {
    return request(
      "/medical/overview",
      {
        params:
          talukId !== undefined &&
          talukId !== null &&
          talukId !== ""
            ? {
                taluk_id: talukId,
              }
            : undefined,
      }
    );
  },

  // ==========================================================
  // MEDICAL SUPERVISOR REPORTS
  // ==========================================================

  getMedicalReports: async (
    params = {}
  ) => {
    return request(
      "/medical/reports",
      {
        params,
      }
    );
  },

  createMedicalReport: async (
    payload
  ) => {
    return request(
      "/medical/reports",
      {
        method: "POST",
        body: payload,
      }
    );
  },

  // ==========================================================
  // MEDICAL SUPERVISOR DISEASE REPORT REVIEW
  // ==========================================================

  reviewMedicalReport: async (
    reportId,
    payload = {}
  ) => {
    if (
      reportId === undefined ||
      reportId === null ||
      reportId === ""
    ) {
      throw new Error(
        "A valid disease report ID is required."
      );
    }

    const decision = String(
      payload?.decision || ""
    ).trim().toUpperCase();

    const allowedDecisions = [
      "APPROVE",
      "REJECT",
      "KEEP_PENDING",
    ];

    if (!allowedDecisions.includes(decision)) {
      throw new Error(
        "Invalid review decision. Use APPROVE, REJECT or KEEP_PENDING."
      );
    }

    return request(
      `/medical/reports/${reportId}/review`,
      {
        method: "PUT",
        body: {
          decision,
          review_notes: String(
            payload?.review_notes || ""
          ).trim(),
        },
      }
    );
  },

  // ==========================================================
  // WEEKLY MONITORING
  // ==========================================================

  // Supports BOTH:
  //
  // api.getMedicalMonitoring()
  //
  // and:
  //
  // api.getMedicalMonitoring(202635)
  //
  // and:
  //
  // api.getMedicalMonitoring({
  //   week_number: 202635
  // })

  getMedicalMonitoring: async (
    weekOrOptions
  ) => {
    let params = {};

    if (
      typeof weekOrOptions === "number" ||
      typeof weekOrOptions === "string"
    ) {
      params.week_number = weekOrOptions;
    } else if (
      weekOrOptions &&
      typeof weekOrOptions === "object"
    ) {
      params = {
        ...weekOrOptions,
      };
    }

    return request(
      "/medical/monitoring",
      {
        params,
      }
    );
  },

  // ==========================================================
  // ANALYTICS
  // ==========================================================

  getMedicalAnalytics: async (
    weeks = 8
  ) => {
    return request(
      "/medical/analytics",
      {
        params: {
          weeks,
        },
      }
    );
  },

  // ==========================================================
  // RISK MAP
  // ==========================================================

  getMedicalRiskMap: async (
    disease = ""
  ) => {
    return request(
      "/medical/risk-map",
      {
        params: disease
          ? {
              disease,
            }
          : undefined,
      }
    );
  },

  // ==========================================================
  // EMERGING DISEASE REVIEW
  // ==========================================================

  reviewEmergingDisease: async (
    reportId,
    payload
  ) => {
    return request(
      `/medical/emerging/${reportId}/review`,
      {
        method: "PUT",
        body: payload,
      }
    );
  },

  // ==========================================================
  // SUPERVISOR AGENTS
  // ==========================================================

  getSupervisorAgents: async () => {
    return request(
      "/medical/agents"
    );
  },

  getSupervisorAgentIssues: async () => {
    return request(
      "/medical/agent-issues"
    );
  },

  // ==========================================================
  // SUBMIT AGENT ISSUE
  // ==========================================================

  submitAgentIssue: async (
    payload
  ) => {
    const formData = new FormData();

    formData.append(
      "agent_id",
      String(
        Number(payload?.agent_id)
      )
    );

    formData.append(
      "issue_type",
      String(
        payload?.issue_type || ""
      ).trim()
    );

    formData.append(
      "severity",
      String(
        payload?.severity || "Medium"
      ).trim()
    );

    formData.append(
      "description",
      String(
        payload?.description || ""
      ).trim()
    );

    formData.append(
      "evidence",
      String(
        payload?.evidence || ""
      ).trim()
    );

    if (
      Array.isArray(payload?.files)
    ) {
      payload.files.forEach(
        (file) => {
          if (file) {
            formData.append(
              "proof",
              file
            );
          }
        }
      );
    }

    return request(
      "/medical/agent-issues",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  // ==========================================================
  // REMIND AGENT
  // ==========================================================

  remindSupervisorAgent: async (
    agentId
  ) => {
    return request(
      `/medical/agents/${agentId}/remind`,
      {
        method: "POST",
      }
    );
  },

  // ==========================================================
  // AGENT
  // ==========================================================

  getAgentEmerging: async () => {
    return request(
      "/agent/emerging"
    );
  },

  getMyEmergingReports: async () => {
    return request(
      "/agent/emerging/mine"
    );
  },

  // ==========================================================
  // ADMIN
  // ==========================================================

  getAdminStats: async () => {
    return request(
      "/admin/stats"
    );
  },

  getAgentIssues: async () => {
    return request(
      "/admin/agent-issues"
    );
  },

  reviewAgentIssue: async (
    issueId,
    payload
  ) => {
    return request(
      `/admin/agent-issues/${issueId}/review`,
      {
        method: "PUT",
        body: payload,
      }
    );
  },

  getAllReports: async (
    params = {}
  ) => {
    return request(
      "/admin/reports",
      {
        params,
      }
    );
  },

  runPredictions: async () => {
    return request(
      "/admin/predictions/run",
      {
        method: "POST",
      }
    );
  },

  getLatestPredictions: async (
    params = {}
  ) => {
    return request(
      "/admin/predictions",
      {
        params,
      }
    );
  },

  listAdminNotifications: async () => {
    return request(
      "/admin/notifications"
    );
  },

  createNotification: async (
    payload
  ) => {
    return request(
      "/admin/notifications",
      {
        method: "POST",
        body: payload,
      }
    );
  },

  // ==========================================================
  // ACTIVITY LOGS
  // ==========================================================

  getActivityLogs: async () => {
    return request(
      "/admin/activity-logs"
    );
  },

  // ==========================================================
  // HOME RELIEF
  // ==========================================================

  searchHomeRelief: async (
    query
  ) => {
    const searchText =
      String(query || "").trim();

    if (!searchText) {
      return emptyHomeReliefResponse();
    }

    return request(
      "/home-relief/search",
      {
        params: {
          q: searchText,
        },
      }
    );
  },

  getHomeRelief: async (
    query
  ) => {
    const searchText =
      String(query || "").trim();

    if (!searchText) {
      return emptyHomeReliefResponse();
    }

    return request(
      "/home-relief/search",
      {
        params: {
          q: searchText,
        },
      }
    );
  },

  getHomeReliefRemedy: async (
    remedyId,
    options = {}
  ) => {
    return request(
      `/home-relief/${remedyId}`,
      {
        params: options,
      }
    );
  },

  getHomeReliefSafety: async (
    remedyId,
    condition = null
  ) => {
    return request(
      `/home-relief/${remedyId}/safety`,
      {
        params: condition
          ? {
              condition,
            }
          : undefined,
      }
    );
  },

  getHomeReliefAlternatives: async (
    remedyId,
    condition = null
  ) => {
    return request(
      `/home-relief/${remedyId}/alternatives`,
      {
        params: condition
          ? {
              condition,
            }
          : undefined,
      }
    );
  },

  searchHomeReliefWithContext: async (
    query,
    context = {}
  ) => {
    const searchText =
      String(query || "").trim();

    if (!searchText) {
      return emptyHomeReliefResponse();
    }

    return request(
      "/home-relief/search",
      {
        params: {
          q: searchText,
          ...context,
        },
      }
    );
  },

  // ==========================================================
  // MEDICAL HOME RELIEF
  // ==========================================================

  getSupervisorHomeRelief: async (
    params = {}
  ) => {
    return request(
      "/medical/home-relief",
      {
        params,
      }
    );
  },

  getMedicalHomeRelief: async (
    params = {}
  ) => {
    return request(
      "/medical/home-relief",
      {
        params,
      }
    );
  },

  getMedicalHomeReliefs: async (
    params = {}
  ) => {
    return request(
      "/medical/home-relief",
      {
        params,
      }
    );
  },

  getSupervisorMedicalHomeRelief: async (
    params = {}
  ) => {
    return request(
      "/medical/home-relief",
      {
        params,
      }
    );
  },

  createHomeRelief: async (
    payload
  ) => {
    return request(
      "/medical/home-relief",
      {
        method: "POST",
        body: payload,
      }
    );
  },

  updateHomeRelief: async (
    remedyId,
    payload
  ) => {
    return request(
      `/medical/home-relief/${remedyId}`,
      {
        method: "PATCH",
        body: payload,
      }
    );
  },

  deleteHomeRelief: async (
    remedyId
  ) => {
    return request(
      `/medical/home-relief/${remedyId}`,
      {
        method: "DELETE",
      }
    );
  },

  deactivateHomeRelief: async (
    remedyId
  ) => {
    return request(
      `/medical/home-relief/${remedyId}/deactivate`,
      {
        method: "POST",
      }
    );
  },

  createHomeReliefSafetyRule: async (
    remedyId,
    payload
  ) => {
    return request(
      `/medical/home-relief/${remedyId}/safety-rules`,
      {
        method: "POST",
        body: payload,
      }
    );
  },

  updateHomeReliefSafetyRule: async (
    remedyId,
    ruleId,
    payload
  ) => {
    return request(
      `/medical/home-relief/${remedyId}/safety-rules/${ruleId}`,
      {
        method: "PUT",
        body: payload,
      }
    );
  },

  deleteHomeReliefSafetyRule: async (
    remedyId,
    ruleId
  ) => {
    return request(
      `/medical/home-relief/${remedyId}/safety-rules/${ruleId}`,
      {
        method: "DELETE",
      }
    );
  },

  approveHomeRelief: async (
    remedyId
  ) => {
    return request(
      `/medical/home-relief/${remedyId}/approve`,
      {
        method: "POST",
      }
    );
  },

  rejectHomeRelief: async (
    remedyId,
    reason
  ) => {
    return request(
      `/medical/home-relief/${remedyId}/reject`,
      {
        method: "POST",
        body: {
          reason,
        },
      }
    );
  },

  // ==========================================================
  // GENERIC
  // ==========================================================

  request,
};

// ============================================================
// DISEASE LIST
// ============================================================

export const DISEASES = [
  "Dengue",
  "Malaria",
  "Typhoid",
  "Influenza",
  "Chikungunya",
];

// ============================================================
// RISK COLORS
// ============================================================

export const RISK_COLORS = {
  Low: "#2E9E4F",
  Moderate: "#E0A800",
  High: "#E0642A",
  Critical: "#C62828",
};

// ============================================================
// EXPORTS
// ============================================================

export {
  api,
  request,
  getToken,
  getSession,
  setSession,
  clearSession,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default api;