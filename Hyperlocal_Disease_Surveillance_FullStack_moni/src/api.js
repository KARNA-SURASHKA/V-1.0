// ============================================================
// API CONFIGURATION
// ============================================================

// Backend URL. VITE_API_BASE can override it; otherwise use the same
// loopback hostname that opened the frontend so localhost/127.0.0.1
// do not accidentally get mixed during development.
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `http://${window.location.hostname || "127.0.0.1"}:8000`;

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
  if (
    session === null ||
    session === undefined
  ) {
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
// ERROR NORMALIZATION
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
        if (!item) return "";

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
// BUILD URL
// ============================================================

const buildUrl = (
  endpoint,
  params
) => {
  let url =
    `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams =
      new URLSearchParams();

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          searchParams.append(
            key,
            String(value)
          );
        }
      }
    );

    const queryString =
      searchParams.toString();

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
    body,
    params,
    auth = true,
  } = options;

  const url = buildUrl(
    endpoint,
    params
  );

  const headers = {
    Accept: "application/json",
  };

  if (
    body !== undefined &&
    body !== null
  ) {
    headers[
      "Content-Type"
    ] = "application/json";
  }

  // ----------------------------------------------------------
  // AUTHORIZATION
  // ----------------------------------------------------------

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }
  }

  console.log(
    `%c[API REQUEST] ${method} ${url}`,
    "color:#087f5b;font-weight:bold",
    {
      authenticated:
        auth && Boolean(getToken()),
      hasToken:
        Boolean(getToken()),
    }
  );

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------

  let response;

  try {
    response = await fetch(
      url,
      {
        method,
        headers,
        body:
          body !== undefined &&
          body !== null
            ? JSON.stringify(body)
            : undefined,
      }
    );
  } catch (error) {
    console.error(
      `[API NETWORK ERROR] ${method} ${url}`,
      error
    );

    throw new Error(
      `Network error while calling ${method} ${endpoint}. ` +
      `The browser could not complete the request to ${API_BASE}. ` +
      `Check the browser Console and backend terminal.`
    );
  }

  // ----------------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------------

  const text =
    await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  console.log(
    `%c[API RESPONSE] ${response.status} ${method} ${url}`,
    response.ok
      ? "color:#087f5b;font-weight:bold"
      : "color:#c92a2a;font-weight:bold",
    data
  );

  // ----------------------------------------------------------
  // HTTP ERROR
  // ----------------------------------------------------------

  if (!response.ok) {
    let message =
      getErrorMessage(
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

    // --------------------------------------------------------
    // Authentication failure
    // --------------------------------------------------------

    if (
      response.status === 401 &&
      auth
    ) {
      console.warn(
        `[API AUTH ERROR] ${endpoint}: 401 Unauthorized`
      );

      clearSession();

      throw new Error(
        `Authentication expired or invalid for ${endpoint}. ` +
        `Please log in again.`
      );
    }

    // --------------------------------------------------------
    // Permission failure
    // --------------------------------------------------------

    if (
      response.status === 403
    ) {
      throw new Error(
        `You do not have permission to access ${endpoint}. ` +
        `Your account must have the Medical Supervisor role.`
      );
    }

    // --------------------------------------------------------
    // Not found
    // --------------------------------------------------------

    if (
      response.status === 404
    ) {
      throw new Error(
        `API endpoint not found: ${endpoint}`
      );
    }

    // --------------------------------------------------------
    // Server error
    // --------------------------------------------------------

    if (
      response.status >= 500
    ) {
      throw new Error(
        `Backend error ${response.status} from ${endpoint}: ${message}`
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

  getMedicalDiseases:
    async () => {
      return request(
        "/medical/diseases"
      );
    },

  // ==========================================================
  // EMERGING DISEASES
  // ==========================================================

  getEmergingDiseases:
    async () => {
      return request(
        "/medical/emerging"
      );
    },

  getMedicalEmergingDiseases:
    async () => {
      return request(
        "/medical/emerging"
      );
    },

  // ==========================================================
  // MEDICAL OVERVIEW
  // ==========================================================

  getMedicalOverview:
    async (talukId) => {
      return request(
        "/medical/overview",
        {
          params:
            talukId !== undefined &&
            talukId !== null &&
            talukId !== ""
              ? {
                  taluk_id:
                    talukId,
                }
              : undefined,
        }
      );
    },

  // ==========================================================
  // MEDICAL REPORTS
  // ==========================================================

  getMedicalReports:
    async (params = {}) => {
      return request(
        "/medical/reports",
        {
          params,
        }
      );
    },

  // ==========================================================
  // WEEKLY MONITORING
  // ==========================================================

  getMedicalMonitoring:
    async (weekNumber) => {
      return request(
        "/medical/monitoring",
        {
          params:
            weekNumber !==
              undefined &&
            weekNumber !== null
              ? {
                  week_number:
                    weekNumber,
                }
              : undefined,
        }
      );
    },

  // ==========================================================
  // ANALYTICS
  // ==========================================================

  getMedicalAnalytics:
    async (weeks = 4) => {
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

  getMedicalRiskMap:
    async (disease = "") => {
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
  // EMERGING REVIEW
  // ==========================================================

  reviewEmergingDisease:
    async (
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

  getSupervisorAgents:
    async () => {
      return request(
        "/medical/agents"
      );
    },

  getSupervisorAgentIssues:
    async () => {
      return request(
        "/medical/agent-issues"
      );
    },

  // ----------------------------------------------------------
  // FIX:
  // SUBMIT AGENT ISSUE
  // ----------------------------------------------------------

  submitAgentIssue:
    async (payload) => {
      const formData = new FormData();
      formData.append("agent_id", String(Number(payload?.agent_id)));
      formData.append("issue_type", String(payload?.issue_type || "").trim());
      formData.append("severity", String(payload?.severity || "Medium").trim());
      formData.append("description", String(payload?.description || "").trim());
      formData.append("evidence", String(payload?.evidence || "").trim());
      (payload?.files || []).forEach((file) => formData.append("proof", file));

      const token = getToken();
      const response = await fetch(`${API_BASE}/medical/agent-issues`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(data?.detail || data?.message));
      return data;
    },

  remindSupervisorAgent:
    async (agentId) => {
      return request(`/medical/agents/${agentId}/remind`, { method: "POST" });
    },

  // ==========================================================
  // AGENT
  // ==========================================================

  getAgentEmerging:
    async () => {
      return request(
        "/agent/emerging"
      );
    },

  getMyEmergingReports:
    async () => {
      return request(
        "/agent/emerging/mine"
      );
    },

  // ==========================================================
  // ADMIN
  // ==========================================================

  getAdminStats:
    async () => {
      return request(
        "/admin/stats"
      );
    },

  getAgentIssues:
    async () => {
      return request(
        "/admin/agent-issues"
      );
    },

  reviewAgentIssue:
    async (
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

  getAllReports:
    async (params = {}) => {
      return request(
        "/admin/reports",
        {
          params,
        }
      );
    },

  runPredictions:
    async () => {
      return request(
        "/admin/predictions/run",
        {
          method: "POST",
        }
      );
    },

  getLatestPredictions:
    async (params = {}) => {
      return request(
        "/admin/predictions",
        {
          params,
        }
      );
    },

  listAdminNotifications:
    async () => {
      return request(
        "/admin/notifications"
      );
    },

  createNotification:
    async (payload) => {
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

  getActivityLogs:
    async () => {
      return request(
        "/admin/activity-logs"
      );
    },

  // ==========================================================
  // HOME RELIEF
  // ==========================================================

  searchHomeRelief:
    async (query) => {
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

  getHomeRelief:
    async (query) => {
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

  getHomeReliefRemedy:
    async (
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

  getHomeReliefSafety:
    async (
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

  getHomeReliefAlternatives:
    async (
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

  searchHomeReliefWithContext:
    async (
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

  getSupervisorHomeRelief:
    async (params = {}) => {
      return request(
        "/medical/home-relief",
        {
          params,
        }
      );
    },

  getMedicalHomeRelief:
    async (params = {}) => {
      return request(
        "/medical/home-relief",
        {
          params,
        }
      );
    },

  getMedicalHomeReliefs:
    async (params = {}) => {
      return request(
        "/medical/home-relief",
        {
          params,
        }
      );
    },

  getSupervisorMedicalHomeRelief:
    async (params = {}) => {
      return request(
        "/medical/home-relief",
        {
          params,
        }
      );
    },

  createHomeRelief:
    async (payload) => {
      return request(
        "/medical/home-relief",
        {
          method: "POST",
          body: payload,
        }
      );
    },

  updateHomeRelief:
    async (
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

  deleteHomeRelief:
    async (remedyId) => {
      return request(
        `/medical/home-relief/${remedyId}`,
        {
          method: "DELETE",
        }
      );
    },

  deactivateHomeRelief:
    async (remedyId) => {
      return request(
        `/medical/home-relief/${remedyId}/deactivate`,
        {
          method: "POST",
        }
      );
    },

  createHomeReliefSafetyRule:
    async (
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

  updateHomeReliefSafetyRule:
    async (
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

  deleteHomeReliefSafetyRule:
    async (
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

  approveHomeRelief:
    async (remedyId) => {
      return request(
        `/medical/home-relief/${remedyId}/approve`,
        {
          method: "POST",
        }
      );
    },

  rejectHomeRelief:
    async (
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
// DEFAULT
// ============================================================

export default api;