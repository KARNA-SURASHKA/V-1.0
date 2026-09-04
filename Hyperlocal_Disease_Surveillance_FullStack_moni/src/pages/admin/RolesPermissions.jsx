import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileCheck2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

// ============================================================
// STORAGE
// ============================================================

const STORAGE_KEY =
  "hyperlocal_roles_permissions_v1";

// ============================================================
// MODULES
// ============================================================

const MODULES = [
  "Dashboard",
  "Report Management",
  "Weekly Monitoring",
  "Risk Map",
  "Analytics",
  "Agent Management",
  "Location Management",
  "User Management",
  "System Settings",
  "Roles & Permissions",
];

// ============================================================
// DEFAULT ROLES
// ============================================================

const DEFAULT_ROLES = [
  {
    id: 1,
    name: "System Administrator",
    description:
      "Full access to all system features and settings",
    users: 2,
    status: "Active",
    lastUpdated: "May 26, 2025",
    updatedTime: "10:30 AM",
    icon: "shield",
    iconClass:
      "bg-[#EAF7EE] text-[#087A32]",
    permissions: MODULES.reduce(
      (acc, module) => {
        acc[module] = true;
        return acc;
      },
      {}
    ),
    dataAccess:
      "All Districts",
    dataDescription:
      "Can access and manage all districts, taluks and system-wide surveillance data.",
  },

  {
    id: 2,
    name: "Medical Supervisor",
    description:
      "Manage surveillance, agents, reports for assigned district",
    users: 4,
    status: "Active",
    lastUpdated: "May 25, 2025",
    updatedTime: "04:15 PM",
    icon: "supervisor",
    iconClass:
      "bg-[#F0ECFF] text-[#6542D6]",
    permissions: {
      Dashboard: true,
      "Report Management": true,
      "Weekly Monitoring": true,
      "Risk Map": true,
      Analytics: true,
      "Agent Management": true,
      "Location Management": true,
      "User Management": true,
      "System Settings": false,
      "Roles & Permissions": false,
    },
    dataAccess:
      "District Level Access",
    dataDescription:
      "Can access and manage all data within their assigned district and all its taluks.",
  },

  {
    id: 3,
    name: "Field Agent",
    description:
      "Submit disease reports and view assigned data",
    users: 18,
    status: "Active",
    lastUpdated: "May 24, 2025",
    updatedTime: "11:20 AM",
    icon: "agent",
    iconClass:
      "bg-[#EDF5FF] text-[#2476D8]",
    permissions: {
      Dashboard: true,
      "Report Management": true,
      "Weekly Monitoring": true,
      "Risk Map": true,
      Analytics: false,
      "Agent Management": false,
      "Location Management": true,
      "User Management": false,
      "System Settings": false,
      "Roles & Permissions": false,
    },
    dataAccess:
      "Taluk Level Access",
    dataDescription:
      "Can view assigned taluk data and submit disease surveillance reports.",
  },

  {
    id: 4,
    name: "User",
    description:
      "View reports and dashboards (with read-only access)",
    users: 4,
    status: "Active",
    lastUpdated: "May 23, 2025",
    updatedTime: "09:45 AM",
    icon: "user",
    iconClass:
      "bg-[#FFF4E7] text-[#E88918]",
    permissions: {
      Dashboard: true,
      "Report Management": true,
      "Weekly Monitoring": true,
      "Risk Map": true,
      Analytics: false,
      "Agent Management": false,
      "Location Management": false,
      "User Management": false,
      "System Settings": false,
      "Roles & Permissions": false,
    },
    dataAccess:
      "Read-only Access",
    dataDescription:
      "Can view approved surveillance information and dashboards.",
  },
];

// ============================================================
// HELPERS
// ============================================================

const cloneRoles = (roles) =>
  JSON.parse(JSON.stringify(roles));

const getInitials = (name = "Role") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getRoleIcon = (role) => {
  if (role.icon === "shield") {
    return ShieldCheck;
  }

  if (role.icon === "supervisor") {
    return UserCheck;
  }

  if (role.icon === "agent") {
    return UsersRound;
  }

  return UserRound;
};

const getRoleIconStyle = (role) => {
  if (role.iconClass) {
    return role.iconClass;
  }

  return "bg-[#EFF6F1] text-[#087A32]";
};

const loadRoles = () => {
  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return cloneRoles(
        DEFAULT_ROLES
      );
    }

    const parsed =
      JSON.parse(saved);

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0
    ) {
      return cloneRoles(
        DEFAULT_ROLES
      );
    }

    return parsed;
  } catch {
    return cloneRoles(
      DEFAULT_ROLES
    );
  }
};

const saveRoles = (roles) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(roles)
    );
  } catch {
    // Ignore localStorage failures.
  }
};

// ============================================================
// COMPONENT
// ============================================================

export default function RolesPermissions({
  onNavigate,
}) {
  const [roles, setRoles] =
    useState(loadRoles);

  const [selectedId, setSelectedId] =
    useState(2);

  const [search, setSearch] =
    useState("");

  const [menuId, setMenuId] =
    useState(null);

  const [modal, setModal] =
    useState(null);

  const [editingRole, setEditingRole] =
    useState(null);

  const [form, setForm] =
    useState({
      name: "",
      description: "",
      dataAccess:
        "District Level Access",
      permissions: {},
    });

  const [notice, setNotice] =
    useState("");

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  useEffect(() => {
    saveRoles(roles);
  }, [roles]);

  // ----------------------------------------------------------
  // AUTO SELECT
  // ----------------------------------------------------------

  useEffect(() => {
    if (
      roles.length > 0 &&
      !roles.some(
        (role) =>
          role.id === selectedId
      )
    ) {
      setSelectedId(
        roles[0].id
      );
    }
  }, [roles, selectedId]);

  // ----------------------------------------------------------
  // FILTER
  // ----------------------------------------------------------

  const filteredRoles =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return roles;
      }

      return roles.filter(
        (role) =>
          role.name
            .toLowerCase()
            .includes(term) ||
          role.description
            .toLowerCase()
            .includes(term)
      );
    }, [roles, search]);

  // ----------------------------------------------------------
  // SELECTED ROLE
  // ----------------------------------------------------------

  const selectedRole =
    useMemo(
      () =>
        roles.find(
          (role) =>
            role.id === selectedId
        ) ||
        filteredRoles[0] ||
        roles[0] ||
        null,
      [
        roles,
        selectedId,
        filteredRoles,
      ]
    );

  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  const totalRoles =
    roles.length;

  const usersAssigned =
    roles.reduce(
      (total, role) =>
        total +
        Number(role.users || 0),
      0
    );

  const permissionsCount =
    MODULES.length *
    roles.length;

  const restrictedAccess =
    roles.reduce(
      (total, role) =>
        total +
        MODULES.filter(
          (module) =>
            role.permissions?.[
              module
            ] === false
        ).length,
      0
    );

  // ----------------------------------------------------------
  // NOTICE
  // ----------------------------------------------------------

  const showNotice = (
    message
  ) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2600);
  };

  // ----------------------------------------------------------
  // OPEN ADD
  // ----------------------------------------------------------

  const openAddRole = () => {
    const permissions =
      MODULES.reduce(
        (acc, module) => {
          acc[module] =
            false;
          return acc;
        },
        {}
      );

    setForm({
      name: "",
      description: "",
      dataAccess:
        "District Level Access",
      permissions,
    });

    setEditingRole(null);
    setModal("add");
    setMenuId(null);
  };

  // ----------------------------------------------------------
  // OPEN EDIT
  // ----------------------------------------------------------

  const openEditRole = (
    role
  ) => {
    setEditingRole(role);

    setForm({
      name: role.name,
      description:
        role.description,
      dataAccess:
        role.dataAccess ||
        "District Level Access",
      permissions: {
        ...role.permissions,
      },
    });

    setModal("edit");
    setMenuId(null);
  };

  // ----------------------------------------------------------
  // SAVE ROLE
  // ----------------------------------------------------------

  const saveRole = (
    event
  ) => {
    event.preventDefault();

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    if (!name) {
      showNotice(
        "Role name is required."
      );
      return;
    }

    if (!description) {
      showNotice(
        "Role description is required."
      );
      return;
    }

    const duplicate =
      roles.some(
        (role) =>
          role.name
            .toLowerCase() ===
            name.toLowerCase() &&
          role.id !==
            editingRole?.id
      );

    if (duplicate) {
      showNotice(
        "A role with this name already exists."
      );
      return;
    }

    if (modal === "add") {
      const nextId =
        Math.max(
          0,
          ...roles.map(
            (role) =>
              Number(role.id)
          )
        ) + 1;

      const newRole = {
        id: nextId,
        name,
        description,
        users: 0,
        status: "Active",
        lastUpdated:
          "Today",
        updatedTime:
          new Date().toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute:
                "2-digit",
            }
          ),
        icon: "user",
        iconClass:
          "bg-[#EFF6F1] text-[#087A32]",
        permissions: {
          ...form.permissions,
        },
        dataAccess:
          form.dataAccess,
        dataDescription:
          getDataDescription(
            form.dataAccess
          ),
      };

      setRoles((prev) => [
        ...prev,
        newRole,
      ]);

      setSelectedId(
        nextId
      );

      showNotice(
        "Role created successfully."
      );
    } else {
      setRoles((prev) =>
        prev.map(
          (role) => {
            if (
              role.id !==
              editingRole.id
            ) {
              return role;
            }

            return {
              ...role,
              name,
              description,
              dataAccess:
                form.dataAccess,
              dataDescription:
                getDataDescription(
                  form.dataAccess
                ),
              permissions: {
                ...form.permissions,
              },
              lastUpdated:
                "Today",
              updatedTime:
                new Date().toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                ),
            };
          }
        )
      );

      showNotice(
        "Role permissions updated successfully."
      );
    }

    setModal(null);
    setEditingRole(null);
  };

  // ----------------------------------------------------------
  // TOGGLE ROLE STATUS
  // ----------------------------------------------------------

  const toggleStatus = (
    role
  ) => {
    setRoles((prev) =>
      prev.map(
        (item) =>
          item.id === role.id
            ? {
                ...item,
                status:
                  item.status ===
                  "Active"
                    ? "Inactive"
                    : "Active",
                lastUpdated:
                  "Today",
              }
            : item
      )
    );

    showNotice(
      role.status ===
        "Active"
        ? `${role.name} deactivated.`
        : `${role.name} activated.`
    );

    setMenuId(null);
  };

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  const deleteRole = (
    role
  ) => {
    if (
      role.users > 0
    ) {
      showNotice(
        `${role.name} has assigned users. Deactivate it instead of deleting.`
      );
      setMenuId(null);
      return;
    }

    const confirmed =
      window.confirm(
        `Delete the "${role.name}" role?`
      );

    if (!confirmed) {
      return;
    }

    setRoles((prev) =>
      prev.filter(
        (item) =>
          item.id !== role.id
      )
    );

    showNotice(
      "Role deleted successfully."
    );

    setMenuId(null);
  };

  // ----------------------------------------------------------
  // PERMISSION TOGGLE
  // ----------------------------------------------------------

  const togglePermission = (
    module
  ) => {
    if (!selectedRole) {
      return;
    }

    if (
      selectedRole.name ===
      "System Administrator"
    ) {
      showNotice(
        "System Administrator has full system access."
      );
      return;
    }

    setRoles((prev) =>
      prev.map(
        (role) => {
          if (
            role.id !==
            selectedRole.id
          ) {
            return role;
          }

          return {
            ...role,
            permissions: {
              ...role.permissions,
              [module]:
                !role.permissions?.[
                  module
                ],
            },
            lastUpdated:
              "Today",
          };
        }
      )
    );

    showNotice(
      `${module} permission updated.`
    );
  };

  // ----------------------------------------------------------
  // SELECT ROLE
  // ----------------------------------------------------------

  const selectRole = (
    role
  ) => {
    setSelectedId(
      role.id
    );
    setMenuId(null);
  };

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------

  const exportRoles = () => {
    const header = [
      "Role Name",
      "Description",
      "Users",
      "Status",
      "Data Access",
    ];

    const rows =
      roles.map(
        (role) => [
          role.name,
          role.description,
          role.users,
          role.status,
          role.dataAccess,
        ]
      );

    const csv = [
      header,
      ...rows,
    ]
      .map(
        (row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value ?? ""
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "hyperlocal-roles-permissions.csv";

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );

    showNotice(
      "Roles exported successfully."
    );
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="relative w-full">

      {/* =====================================================
          TOAST
      ====================================================== */}

      {notice && (
        <div className="fixed right-[25px] top-[82px] z-[100] rounded-[8px] border border-[#CDE7D5] bg-white px-[16px] py-[11px] text-[11px] font-medium text-[#087A32] shadow-[0_8px_30px_rgba(16,24,40,.12)]">
          {notice}
        </div>
      )}

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative mb-[10px] min-h-[165px] overflow-hidden rounded-[10px] bg-white">

        <div className="relative z-10 px-[22px] pt-[22px]">

          <h1 className="text-[27px] font-semibold tracking-[-0.025em] text-[#0D1735]">
            Roles & Permission
          </h1>

          <p className="mt-[7px] text-[12px] font-normal text-[#34425D]">
            Manage system roles and their access permissions.
          </p>

        </div>

        {/* Decorative illustration */}
        <div className="pointer-events-none absolute right-[25px] top-0 h-full w-[58%] overflow-hidden">

          <div className="absolute right-[20px] top-[18px] h-[130px] w-[500px] rounded-full bg-gradient-to-r from-white via-[#F3FAF6] to-[#E8F5EE] opacity-90" />

          <div className="absolute right-[100px] top-[24px] flex h-[112px] w-[360px] items-center justify-center">

            <div className="relative h-[92px] w-[165px] rounded-[8px] border-[5px] border-[#17344D] bg-white shadow-[0_4px_12px_rgba(15,40,60,.12)]">

              <div className="absolute left-[12px] top-[13px] text-[8px] font-bold text-[#27374A]">
                Roles
              </div>

              {[
                1,
                2,
                3,
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="absolute left-[12px] flex items-center gap-[6px]"
                    style={{
                      top:
                        30 +
                        (item -
                          1) *
                          19,
                    }}
                  >
                    <div className="flex h-[10px] w-[10px] items-center justify-center rounded-[2px] bg-[#0B7B3E] text-white">
                      <Check
                        size={7}
                        strokeWidth={
                          3
                        }
                      />
                    </div>

                    <div className="h-[4px] w-[60px] rounded-full bg-[#DCE5E2]" />
                  </div>
                )
              )}

              <div className="absolute right-[11px] top-[15px] h-[55px] w-[42px] rounded-[4px] bg-[#F1F6F4]" />

            </div>

            <div className="ml-[-5px] flex h-[74px] w-[62px] items-center justify-center rounded-full bg-[#0B7B3E] shadow-[0_4px_15px_rgba(11,123,62,.2)]">

              <ShieldCheck
                size={38}
                strokeWidth={
                  1.5
                }
                className="text-white"
              />

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="mb-[18px] grid grid-cols-4 gap-[14px]">

        <StatCard
          icon={
            <UsersRound
              size={25}
            />
          }
          iconClass="bg-[#EAF7EE] text-[#087A32]"
          title="TOTAL ROLES"
          value={totalRoles}
          subtitle="System roles defined"
          footer={
            totalRoles > 4
              ? `↑ ${
                  totalRoles - 4
                } added this month`
              : "↑ 1 added this month"
          }
        />

        <StatCard
          icon={
            <UserCheck
              size={25}
            />
          }
          iconClass="bg-[#EAF7EE] text-[#087A32]"
          title="USERS ASSIGNED"
          value={usersAssigned}
          subtitle="Across all roles"
          footer="View users →"
        />

        <StatCard
          icon={
            <FileCheck2
              size={25}
            />
          }
          iconClass="bg-[#F0ECFF] text-[#6542D6]"
          title="PERMISSIONS"
          value={permissionsCount}
          subtitle="Total permissions"
          footer="View all →"
        />

        <StatCard
          icon={
            <ShieldCheck
              size={25}
            />
          }
          iconClass="bg-[#FFF2E2] text-[#E88918]"
          title="RESTRICTED ACCESS"
          value={restrictedAccess}
          subtitle="Permissions restricted"
          footer="View details →"
          footerClass="text-[#E36C1B]"
        />

      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="grid grid-cols-[minmax(0,1fr)_420px] gap-[14px]">

        {/* ===================================================
            ROLES TABLE
        ==================================================== */}

        <div className="min-w-0 overflow-hidden rounded-[10px] border border-[#E1E8E4] bg-white shadow-[0_2px_7px_rgba(31,49,68,.035)]">

          <div className="flex h-[63px] items-center justify-between border-b border-[#E8ECEA] px-[20px]">

            <div className="flex items-center gap-[22px]">

              <h2 className="text-[14px] font-semibold text-[#142039]">
                ROLES
              </h2>

              <div className="relative w-[268px]">

                <Search
                  size={16}
                  className="absolute left-[11px] top-[9px] text-[#607084]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search roles..."
                  className="h-[34px] w-full rounded-[6px] border border-[#DCE3DE] bg-white pl-[34px] pr-[10px] text-[11px] text-[#27364C] outline-none transition focus:border-[#0A8240] focus:ring-2 focus:ring-[#0A8240]/10"
                />

              </div>

            </div>

            <button
              onClick={
                openAddRole
              }
              className="flex h-[34px] items-center gap-[7px] rounded-[6px] bg-[#087A32] px-[14px] text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#066A2B]"
            >
              <Plus
                size={16}
              />

              Add Role
            </button>

          </div>

          {/* TABLE HEADER */}

          <div className="grid grid-cols-[2fr_2fr_.55fr_.8fr_1fr_45px] border-b border-[#E7ECEA] bg-[#FBFCFB] px-[20px] py-[11px] text-[9px] font-semibold uppercase tracking-[.01em] text-[#26354A]">

            <span>
              ROLE NAME
            </span>

            <span>
              DESCRIPTION
            </span>

            <span>
              USERS
            </span>

            <span>
              STATUS
            </span>

            <span>
              LAST UPDATED
            </span>

            <span className="text-center">
              ACTIONS
            </span>

          </div>

          {/* TABLE ROWS */}

          <div>

            {filteredRoles.length ===
            0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center">

                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#F0F5F2] text-[#A7B6AE]">

                  <UsersRound
                    size={25}
                  />

                </div>

                <p className="mt-[12px] text-[12px] font-medium text-[#526174]">
                  No roles found
                </p>

                <p className="mt-[4px] text-[10px] text-[#84909E]">
                  Try a different search term.
                </p>

              </div>
            ) : (
              filteredRoles.map(
                (role) => {
                  const Icon =
                    getRoleIcon(
                      role
                    );

                  const selected =
                    role.id ===
                    selectedId;

                  return (
                    <div
                      key={
                        role.id
                      }
                      onClick={() =>
                        selectRole(
                          role
                        )
                      }
                      className={`group grid cursor-pointer grid-cols-[2fr_2fr_.55fr_.8fr_1fr_45px] items-center border-b border-[#EEF1EF] px-[20px] py-[14px] transition ${
                        selected
                          ? "bg-[#F5FAF7]"
                          : "bg-white hover:bg-[#FAFCFB]"
                      }`}
                    >

                      {/* ROLE */}

                      <div className="flex min-w-0 items-center gap-[11px]">

                        <div
                          className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full ${getRoleIconStyle(
                            role
                          )}`}
                        >
                          <Icon
                            size={18}
                            strokeWidth={
                              1.8
                            }
                          />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-[11px] font-semibold text-[#17233A]">
                            {
                              role.name
                            }
                          </p>

                        </div>

                      </div>

                      {/* DESCRIPTION */}

                      <div className="pr-[15px]">

                        <p className="text-[10px] leading-[15px] text-[#4F5E71]">
                          {
                            role.description
                          }
                        </p>

                      </div>

                      {/* USERS */}

                      <div className="text-[11px] font-medium text-[#17233A]">
                        {
                          role.users
                        }
                      </div>

                      {/* STATUS */}

                      <div>

                        <span
                          className={`inline-flex rounded-[5px] border px-[8px] py-[4px] text-[9px] font-semibold ${
                            role.status ===
                            "Active"
                              ? "border-[#CDE9D5] bg-[#EAF7EE] text-[#087A32]"
                              : "border-[#E0E3E1] bg-[#F3F5F4] text-[#6C7780]"
                          }`}
                        >
                          {
                            role.status
                          }
                        </span>

                      </div>

                      {/* UPDATED */}

                      <div>

                        <p className="text-[10px] font-medium text-[#344054]">
                          {
                            role.lastUpdated
                          }
                        </p>

                        <p className="mt-[2px] text-[9px] text-[#667085]">
                          {
                            role.updatedTime
                          }
                        </p>

                      </div>

                      {/* ACTION */}

                      <div className="relative flex justify-center">

                        <button
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            setMenuId(
                              menuId ===
                                role.id
                                ? null
                                : role.id
                            );
                          }}
                          className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] text-[#667085] transition hover:bg-[#EEF5F0] hover:text-[#087A32]"
                        >
                          <MoreHorizontal
                            size={
                              17
                            }
                          />
                        </button>

                        {menuId ===
                          role.id && (
                          <div
                            onClick={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                            className="absolute right-0 top-[30px] z-30 w-[165px] rounded-[7px] border border-[#E1E7E3] bg-white p-[5px] shadow-[0_8px_24px_rgba(20,35,45,.12)]"
                          >

                            <MenuButton
                              icon={
                                <Edit3
                                  size={
                                    13
                                  }
                                />
                              }
                              label="Edit Role"
                              onClick={() =>
                                openEditRole(
                                  role
                                )
                              }
                            />

                            <MenuButton
                              icon={
                                <ShieldCheck
                                  size={
                                    13
                                  }
                                />
                              }
                              label="Manage Permissions"
                              onClick={() => {
                                setSelectedId(
                                  role.id
                                );
                                setMenuId(
                                  null
                                );
                              }}
                            />

                            <MenuButton
                              icon={
                                <UserCheck
                                  size={
                                    13
                                  }
                                />
                              }
                              label={
                                role.status ===
                                "Active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              onClick={() =>
                                toggleStatus(
                                  role
                                )
                              }
                            />

                            <div className="my-[4px] border-t border-[#EEF1EF]" />

                            <MenuButton
                              danger
                              icon={
                                <Trash2
                                  size={
                                    13
                                  }
                                />
                              }
                              label="Delete Role"
                              onClick={() =>
                                deleteRole(
                                  role
                                )
                              }
                            />

                          </div>
                        )}

                      </div>

                    </div>
                  );
                }
              )
            )}

          </div>

          {/* FOOTER */}

          <div className="flex h-[55px] items-center justify-between px-[20px]">

            <p className="text-[10px] text-[#4E5D71]">
              Showing{" "}
              <span className="font-medium">
                {filteredRoles.length}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {roles.length}
              </span>{" "}
              roles
            </p>

            <div className="flex items-center gap-[5px]">

              <button
                disabled
                className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-[#E1E8E4] text-[#C0C9C4] disabled:opacity-70"
              >
                <ChevronLeft
                  size={15}
                />
              </button>

              <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-[#0B8A43] bg-white text-[10px] font-semibold text-[#087A32]">
                1
              </button>

              <button
                disabled
                className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] border border-[#E1E8E4] text-[#C0C9C4]"
              >
                <ChevronRight
                  size={15}
                />
              </button>

            </div>

          </div>

        </div>

        {/* ===================================================
            PERMISSION OVERVIEW
        ==================================================== */}

        <div className="overflow-hidden rounded-[10px] border border-[#E1E8E4] bg-white shadow-[0_2px_7px_rgba(31,49,68,.035)]">

          <div className="flex min-h-[63px] items-center justify-between border-b border-[#E7ECEA] px-[20px]">

            <div>

              <h2 className="text-[13px] font-semibold text-[#17233A]">
                PERMISSION OVERVIEW
              </h2>

            </div>

            <div className="relative">

              <select
                value={
                  selectedRole?.id ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setSelectedId(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                className="h-[32px] min-w-[170px] appearance-none rounded-[6px] border border-[#DCE3DE] bg-white px-[11px] pr-[30px] text-[10px] font-medium text-[#27364C] outline-none"
              >
                {roles.map(
                  (role) => (
                    <option
                      key={
                        role.id
                      }
                      value={
                        role.id
                      }
                    >
                      {
                        role.name
                      }
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-[9px] top-[9px] text-[#667085]"
              />

            </div>

          </div>

          {selectedRole ? (
            <div className="px-[20px] py-[17px]">

              {/* ROLE DESCRIPTION */}

              <p className="text-[10px] font-semibold text-[#27364C]">
                Role Description
              </p>

              <p className="mt-[7px] text-[10px] leading-[17px] text-[#344054]">
                {
                  selectedRole.description
                }
              </p>

              {/* MODULE ACCESS */}

              <p className="mt-[19px] text-[10px] font-semibold text-[#27364C]">
                Module Access
              </p>

              <div className="mt-[9px] flex flex-wrap gap-[7px]">

                {MODULES.map(
                  (module) => {
                    const enabled =
                      Boolean(
                        selectedRole
                          .permissions?.[
                          module
                        ]
                      );

                    return (
                      <button
                        key={
                          module
                        }
                        onClick={() =>
                          togglePermission(
                            module
                          )
                        }
                        className={`group inline-flex items-center gap-[6px] rounded-[5px] border px-[8px] py-[5px] text-[9px] font-medium transition ${
                          enabled
                            ? "border-[#D6EADB] bg-[#EDF8F0] text-[#087A32]"
                            : "border-[#E1E4E2] bg-[#F4F5F4] text-[#5D6875]"
                        }`}
                      >

                        <span>
                          {
                            module
                          }
                        </span>

                        {enabled ? (
                          <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-[#8AC9A0] bg-white">
                            <Check
                              size={
                                9
                              }
                              strokeWidth={
                                3
                              }
                            />
                          </span>
                        ) : (
                          <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-[#C7CCC9] bg-white text-[#89928D]">
                            <X
                              size={
                                9
                              }
                              strokeWidth={
                                2.5
                              }
                            />
                          </span>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

              {/* DATA ACCESS */}

              <p className="mt-[19px] text-[10px] font-semibold text-[#27364C]">
                Data Level Access
              </p>

              <div className="mt-[9px] rounded-[7px] border border-[#DCEBE1] bg-[#F1F8F3] p-[12px]">

                <div className="flex items-start gap-[10px]">

                  <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#E0F1E5] text-[#087A32]">

                    <ShieldCheck
                      size={
                        17
                      }
                    />

                  </div>

                  <div>

                    <p className="text-[10px] font-semibold text-[#243046]">
                      {
                        selectedRole.dataAccess ||
                        "District Level Access"
                      }
                    </p>

                    <p className="mt-[4px] text-[9px] leading-[14px] text-[#526174]">
                      {
                        selectedRole.dataDescription ||
                        getDataDescription(
                          selectedRole.dataAccess
                        )
                      }
                    </p>

                  </div>

                </div>

              </div>

              {/* FULL PERMISSIONS */}

              <button
                onClick={() =>
                  openEditRole(
                    selectedRole
                  )
                }
                className="mt-[15px] flex h-[34px] w-full items-center justify-center gap-[7px] rounded-[6px] border border-[#CFE6D7] bg-white text-[10px] font-semibold text-[#087A32] transition hover:bg-[#F4FAF6]"
              >
                View Full Permissions
                <ChevronRight
                  size={14}
                />
              </button>

            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center text-[11px] text-[#748092]">
              Select a role to view permissions.
            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          BOTTOM NOTICE
      ====================================================== */}

      <section className="mt-[18px] flex min-h-[61px] items-center justify-between rounded-[9px] border border-[#E0EAE4] bg-[#F7FBF8] px-[17px]">

        <div className="flex items-center gap-[12px]">

          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#E5F3E9] text-[#087A32]">

            <ShieldCheck
              size={18}
            />

          </div>

          <div>

            <p className="text-[10px] font-semibold text-[#087A32]">
              Permissions are applied in real-time
            </p>

            <p className="mt-[2px] text-[9px] text-[#526174]">
              Changes made to roles or permissions will be immediately reflected for all users.
            </p>

          </div>

        </div>

        <button
          onClick={() =>
            openEditRole(
              selectedRole
            )
          }
          className="flex items-center gap-[7px] text-[10px] font-semibold text-[#087A32] hover:underline"
        >
          Learn more about roles & permissions
          <ChevronRight
            size={14}
          />
        </button>

      </section>

      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {modal && (
        <RoleModal
          mode={modal}
          form={form}
          setForm={setForm}
          onClose={() => {
            setModal(null);
            setEditingRole(
              null
            );
          }}
          onSubmit={
            saveRole
          }
        />
      )}

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  iconClass,
  title,
  value,
  subtitle,
  footer,
  footerClass = "text-[#087A32]",
}) {
  return (
    <div className="min-h-[128px] rounded-[10px] border border-[#E1E8E4] bg-white px-[20px] py-[20px] shadow-[0_2px_7px_rgba(31,49,68,.035)]">

      <div className="flex items-center gap-[17px]">

        <div
          className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full ${iconClass}`}
        >
          {icon}
        </div>

        <div>

          <p className="text-[10px] font-semibold uppercase text-[#26344B]">
            {title}
          </p>

          <p className="mt-[4px] text-[25px] font-semibold leading-none text-[#101B35]">
            {value}
          </p>

          <p className="mt-[7px] text-[10px] text-[#526174]">
            {subtitle}
          </p>

        </div>

      </div>

      <p
        className={`mt-[15px] text-[10px] font-medium ${footerClass}`}
      >
        {footer}
      </p>

    </div>
  );
}

// ============================================================
// MENU BUTTON
// ============================================================

function MenuButton({
  icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-[9px] rounded-[5px] px-[9px] py-[8px] text-left text-[10px] transition ${
        danger
          ? "text-[#C62828] hover:bg-[#FFF4F3]"
          : "text-[#344054] hover:bg-[#F3F7F4]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================================
// ROLE MODAL
// ============================================================

function RoleModal({
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  const updatePermission = (
    module
  ) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]:
          !prev.permissions?.[
            module
          ],
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1625]/35 px-[20px] backdrop-blur-[2px]">

      <div className="max-h-[90vh] w-full max-w-[620px] overflow-hidden rounded-[10px] border border-[#E0E7E3] bg-white shadow-[0_18px_55px_rgba(15,35,50,.22)]">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#E6ECE8] px-[20px] py-[15px]">

          <div>

            <h3 className="text-[15px] font-semibold text-[#142039]">
              {mode ===
              "add"
                ? "Add Role"
                : "Edit Role"}
            </h3>

            <p className="mt-[3px] text-[10px] text-[#667085]">
              Configure role access and permissions.
            </p>

          </div>

          <button
            onClick={
              onClose
            }
            className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#667085] hover:bg-[#F1F4F2]"
          >
            <X
              size={16}
            />
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={
            onSubmit
          }
          className="max-h-[70vh] overflow-y-auto px-[20px] py-[17px]"
        >

          <div className="grid grid-cols-2 gap-[12px]">

            <Field
              label="Role Name"
              value={
                form.name
              }
              onChange={(
                value
              ) =>
                setForm(
                  (
                    prev
                  ) => ({
                    ...prev,
                    name: value,
                  })
                )
              }
              placeholder="e.g. Medical Supervisor"
            />

            <label className="block">

              <span className="text-[10px] font-semibold text-[#344054]">
                Data Level Access
              </span>

              <select
                value={
                  form.dataAccess
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      prev
                    ) => ({
                      ...prev,
                      dataAccess:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className="mt-[5px] h-[35px] w-full rounded-[6px] border border-[#DCE3DE] bg-white px-[9px] text-[10px] text-[#344054] outline-none focus:border-[#087A32]"
              >
                <option>
                  All Districts
                </option>

                <option>
                  District Level Access
                </option>

                <option>
                  Taluk Level Access
                </option>

                <option>
                  Read-only Access
                </option>

              </select>

            </label>

          </div>

          <label className="mt-[12px] block">

            <span className="text-[10px] font-semibold text-[#344054]">
              Description
            </span>

            <textarea
              value={
                form.description
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    prev
                  ) => ({
                    ...prev,
                    description:
                      event
                        .target
                        .value,
                  })
                )
              }
              rows={3}
              placeholder="Describe what this role can do..."
              className="mt-[5px] w-full resize-none rounded-[6px] border border-[#DCE3DE] px-[9px] py-[8px] text-[10px] text-[#344054] outline-none focus:border-[#087A32]"
            />

          </label>

          <div className="mt-[15px]">

            <p className="text-[10px] font-semibold text-[#344054]">
              Module Permissions
            </p>

            <div className="mt-[8px] grid grid-cols-2 gap-[7px]">

              {MODULES.map(
                (module) => {
                  const checked =
                    Boolean(
                      form
                        .permissions?.[
                        module
                      ]
                    );

                  return (
                    <button
                      type="button"
                      key={
                        module
                      }
                      onClick={() =>
                        updatePermission(
                          module
                        )
                      }
                      className={`flex items-center justify-between rounded-[6px] border px-[9px] py-[8px] text-left text-[10px] ${
                        checked
                          ? "border-[#CBE5D2] bg-[#F1F8F3] text-[#087A32]"
                          : "border-[#E2E7E4] bg-white text-[#667085]"
                      }`}
                    >

                      <span>
                        {
                          module
                        }
                      </span>

                      <span
                        className={`flex h-[16px] w-[16px] items-center justify-center rounded-[4px] border ${
                          checked
                            ? "border-[#087A32] bg-[#087A32] text-white"
                            : "border-[#C7CECA] bg-white"
                        }`}
                      >
                        {checked && (
                          <Check
                            size={
                              10
                            }
                            strokeWidth={
                              3
                            }
                          />
                        )}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>

        </form>

        {/* FOOTER */}

        <div className="flex items-center justify-end gap-[8px] border-t border-[#E6ECE8] px-[20px] py-[12px]">

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-[34px] rounded-[6px] border border-[#DCE3DE] px-[14px] text-[10px] font-semibold text-[#344054] hover:bg-[#F7F9F8]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onSubmit
            }
            className="h-[34px] rounded-[6px] bg-[#087A32] px-[15px] text-[10px] font-semibold text-white hover:bg-[#066A2B]"
          >
            {mode ===
            "add"
              ? "Create Role"
              : "Save Changes"}
          </button>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">

      <span className="text-[10px] font-semibold text-[#344054]">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        className="mt-[5px] h-[35px] w-full rounded-[6px] border border-[#DCE3DE] px-[9px] text-[10px] text-[#344054] outline-none focus:border-[#087A32]"
      />

    </label>
  );
}

// ============================================================
// DATA ACCESS DESCRIPTION
// ============================================================

function getDataDescription(
  access
) {
  if (
    access ===
    "All Districts"
  ) {
    return "Can access and manage surveillance information across all districts and taluks.";
  }

  if (
    access ===
    "Taluk Level Access"
  ) {
    return "Can access assigned taluk data and submit or review permitted surveillance information.";
  }

  if (
    access ===
    "Read-only Access"
  ) {
    return "Can view approved surveillance information and dashboards without modification access.";
  }

  return "Can access and manage all data within their assigned district and all its taluks.";
}