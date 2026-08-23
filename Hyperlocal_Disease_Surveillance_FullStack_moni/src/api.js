// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE = "http://localhost:8000";

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
// GENERIC API REQUEST
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

  let url = `${API_BASE}${endpoint}`;

  // ----------------------------------------------------------
  // QUERY PARAMETERS
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // HEADERS
  // ----------------------------------------------------------

  const headers = {
    Accept: "application/json",
  };

  if (
    body !== undefined &&
    body !== null
  ) {
    headers["Content-Type"] =
      "application/json";
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

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------

  let response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        body !== undefined &&
        body !== null
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (error) {
    console.error(
      "API connection error:",
      error
    );

    throw new Error(
      `Could not reach the backend. Is it running at ${API_BASE}?`
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

  // ----------------------------------------------------------
  // ERROR RESPONSE
  // ----------------------------------------------------------

  if (!response.ok) {
    let message;

    if (
      data &&
      typeof data === "object"
    ) {
      message = getErrorMessage(
        data.detail
      );

      if (
        !message ||
        message === "[object Object]"
      ) {
        message =
          getErrorMessage(data);
      }
    } else {
      message =
        getErrorMessage(data);
    }

    if (
      !message ||
      message === "[object Object]"
    ) {
      message =
        response.statusText ||
        "Request failed";
    }

    // --------------------------------------------------------
    // Clear invalid/expired authentication.
    // --------------------------------------------------------

    if (
      response.status === 401 &&
      auth
    ) {
      clearSession();
    }

    throw new Error(message);
  }

  return data;
};

// ============================================================
// API OBJECT
// ============================================================

const api = {
  // ==========================================================
  // AUTHENTICATION
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
  // AI MEDICAL CHATBOT
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
  // EMERGING DISEASE
  // ==========================================================

  getEmergingDiseases: async () => {
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
  // MEDICAL SUPERVISOR - OVERVIEW
  // ==========================================================

  getMedicalOverview:
    async () => {
      return request(
        "/medical/overview"
      );
    },

  // ==========================================================
  // MEDICAL SUPERVISOR - REPORTS
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
  // MEDICAL SUPERVISOR - WEEKLY MONITORING
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
  // MEDICAL SUPERVISOR - ANALYTICS
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
  // MEDICAL SUPERVISOR - RISK MAP
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
  // MEDICAL SUPERVISOR - EMERGING DISEASE REVIEW
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
  // MEDICAL SUPERVISOR - AGENTS
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

  // ==========================================================
  // AGENT - EMERGING DISEASE
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

  // ==========================================================
  // ADMIN - REPORTS
  // ==========================================================

  getAllReports:
    async (params = {}) => {
      return request(
        "/admin/reports",
        {
          params,
        }
      );
    },

  // ==========================================================
  // ADMIN - PREDICTIONS
  // ==========================================================

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

  // ==========================================================
  // ADMIN - NOTIFICATIONS
  // ==========================================================

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
  // HOME RELIEF - USER
  // ==========================================================

  searchHomeRelief:
    async (query) => {
      const searchText =
        String(
          query || ""
        ).trim();

      if (!searchText) {
        return {
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
        };
      }

      return request(
        "/home-relief/search",
        {
          method: "GET",
          params: {
            q: searchText,
          },
        }
      );
    },

  // ==========================================================
  // COMPATIBILITY WITH EXISTING HOME RELIEF COMPONENTS
  // ==========================================================

  getHomeRelief:
    async (query) => {
      const searchText =
        String(
          query || ""
        ).trim();

      if (!searchText) {
        return {
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
        };
      }

      return request(
        "/home-relief/search",
        {
          method: "GET",
          params: {
            q: searchText,
          },
        }
      );
    },

  // ==========================================================
  // HOME RELIEF DETAIL
  // ==========================================================

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

  // ==========================================================
  // HOME RELIEF SAFETY
  // ==========================================================

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

  // ==========================================================
  // HOME RELIEF ALTERNATIVES
  // ==========================================================

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

  // ==========================================================
  // HOME RELIEF SEARCH WITH CONTEXT
  // ==========================================================

  searchHomeReliefWithContext:
    async (
      query,
      context = {}
    ) => {
      const searchText =
        String(
          query || ""
        ).trim();

      if (!searchText) {
        return {
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
        };
      }

      return request(
        "/home-relief/search",
        {
          method: "GET",
          params: {
            q: searchText,
            ...context,
          },
        }
      );
    },

  // ==========================================================
  // MEDICAL SUPERVISOR - HOME RELIEF
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

  // ----------------------------------------------------------
  // Compatibility aliases
  // ----------------------------------------------------------

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

  // ==========================================================
  // CREATE HOME RELIEF
  // ==========================================================

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

  // ==========================================================
  // UPDATE HOME RELIEF
  // ==========================================================

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

  // ==========================================================
  // DELETE HOME RELIEF
  // ==========================================================

  deleteHomeRelief:
    async (remedyId) => {
      return request(
        `/medical/home-relief/${remedyId}`,
        {
          method: "DELETE",
        }
      );
    },

  // ==========================================================
  // DEACTIVATE HOME RELIEF
  // ==========================================================

  deactivateHomeRelief:
    async (remedyId) => {
      return request(
        `/medical/home-relief/${remedyId}/deactivate`,
        {
          method: "POST",
        }
      );
    },

  // ==========================================================
  // HOME RELIEF SAFETY RULES
  // ==========================================================

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

  // ==========================================================
  // APPROVE HOME RELIEF
  // ==========================================================

  approveHomeRelief:
    async (remedyId) => {
      return request(
        `/medical/home-relief/${remedyId}/approve`,
        {
          method: "POST",
        }
      );
    },

  // ==========================================================
  // REJECT HOME RELIEF
  // ==========================================================

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
  // GENERIC REQUEST
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
// NAMED EXPORTS
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