import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import api, {
  DISEASES,
} from "../../api";

import {
  Panel,
  StatusBadge,
  Toast,
} from "./components/MedicalUi";


// ============================================================
// SAFETY CONDITIONS
// ============================================================

const CONDITIONS = [
  [
    "pregnancy",
    "Pregnancy",
  ],
  [
    "diabetes",
    "Diabetes",
  ],
  [
    "kidney_disease",
    "Kidney Disease",
  ],
  [
    "liver_disease",
    "Liver Disease",
  ],
  [
    "hypertension",
    "Hypertension",
  ],
  [
    "heart_disease",
    "Heart Disease",
  ],
  [
    "asthma",
    "Asthma",
  ],
  [
    "child",
    "Children",
  ],
  [
    "infant",
    "Infants",
  ],
  [
    "older_adult",
    "Older Adults",
  ],
  [
    "breastfeeding",
    "Breastfeeding",
  ],
  [
    "allergy",
    "Allergy / Sensitivity",
  ],
  [
    "immunocompromised",
    "Immunocompromised",
  ],
  [
    "medication_interaction",
    "Medication Interaction",
  ],
];


// ============================================================
// EMPTY SAFETY RULE
// ============================================================

const emptyRule = () => ({
  condition_type: "pregnancy",
  condition_value: "Pregnancy",
  suitability: "NOT_RECOMMENDED",
  severity: "MODERATE",
  reason: "",
  alternative_remedy_id: null,
});


// ============================================================
// EMPTY FORM
// ============================================================

const emptyForm = () => ({
  name: "",
  disease: "",
  symptom: "",
  aliases: "",
  category: "supportive_care",
  description: "",
  instructions: "",
  expected_benefit: "",
  medical_rationale: "",
  possible_side_effects: "",
  general_safety_notes: "",
  red_flags: "",
  when_to_seek_care: "",
  safety_rules: [],
});


// ============================================================
// FORM FROM EXISTING REMEDY
// ============================================================

const formFrom = (item) => ({
  ...emptyForm(),
  ...item,

  safety_rules: (
    item?.safety_rules || []
  ).map((rule) => ({
    ...emptyRule(),
    ...rule,
  })),
});


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HomeReliefManagement() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm()
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    disease,
    setDisease,
  ] = useState(
    "All Diseases"
  );

  const [
    category,
    setCategory,
  ] = useState(
    "All Categories"
  );

  const [
    status,
    setStatus,
  ] = useState(
    "All Status"
  );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    toast,
    setToast,
  ] = useState("");


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const perPage = 8;


  // ==========================================================
  // LOAD HOME RELIEF
  // ==========================================================

  const load = async () => {
    try {
      setLoading(true);

      const result =
        await api.getMedicalHomeReliefs();

      setItems(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (error) {
      setToast(
        error?.message ||
          "Unable to load Home Relief records."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    load();
  }, []);


  // ==========================================================
  // DISEASE OPTIONS
  //
  // Combines:
  // 1. Existing API/frontend disease list
  // 2. Diseases already stored in Home Relief
  //
  // This means manually entered diseases become available
  // as suggestions/filter options after being saved.
  // ==========================================================

  const diseaseOptions = useMemo(() => {
    const values = [
      ...(Array.isArray(DISEASES)
        ? DISEASES
        : []),

      ...items.map(
        (item) =>
          item?.disease
      ),
    ];

    const unique =
      new Map();

    values.forEach(
      (value) => {
        const text =
          String(
            value || ""
          ).trim();

        if (!text) {
          return;
        }

        const key =
          text.toLowerCase();

        if (
          !unique.has(key)
        ) {
          unique.set(
            key,
            text
          );
        }
      }
    );

    return Array.from(
      unique.values()
    ).sort(
      (a, b) =>
        a.localeCompare(
          b
        )
    );
  }, [
    items,
  ]);


  // ==========================================================
  // FILTERED REMEDIES
  // ==========================================================

  const filtered =
    useMemo(
      () =>
        items.filter(
          (item) => {
            const query =
              search
                .trim()
                .toLowerCase();

            const searchableText =
              [
                item?.name,
                item?.disease,
                item?.symptom,
                item?.aliases,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
              !query ||
              searchableText.includes(
                query
              );

            const matchesDisease =
              disease ===
                "All Diseases" ||
              String(
                item?.disease || ""
              ).toLowerCase() ===
                disease.toLowerCase();

            const matchesCategory =
              category ===
                "All Categories" ||
              String(
                item?.category || ""
              ).toLowerCase() ===
                category.toLowerCase();

            const matchesStatus =
              status ===
                "All Status" ||
              String(
                item?.status || ""
              ).toLowerCase() ===
                status.toLowerCase();

            return (
              matchesSearch &&
              matchesDisease &&
              matchesCategory &&
              matchesStatus
            );
          }
        ),
      [
        items,
        search,
        disease,
        category,
        status,
      ]
    );


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const pages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          perPage
      )
    );

  const safePage =
    Math.min(
      page,
      pages
    );

  const visible =
    filtered.slice(
      (safePage - 1) *
        perPage,
      safePage *
        perPage
    );


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats = {
    total:
      items.length,

    published:
      items.filter(
        (item) =>
          item?.status ===
          "ACTIVE"
      ).length,

    drafts:
      items.filter(
        (item) =>
          item?.status !==
          "ACTIVE"
      ).length,
  };


  // ==========================================================
  // CREATE
  // ==========================================================

  const openCreate = () => {
    setEditing(null);
    setForm(
      emptyForm()
    );
    setShowForm(true);
  };


  // ==========================================================
  // EDIT
  // ==========================================================

  const openEdit = (
    item
  ) => {
    setEditing(item);

    setForm(
      formFrom(item)
    );

    setShowForm(true);
  };


  // ==========================================================
  // CLOSE DRAWER
  // ==========================================================

  const close = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditing(null);
  };


  // ==========================================================
  // FORM SETTER
  // ==========================================================

  const setField = (
    key,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  };


  // ==========================================================
  // ADD SAFETY RULE
  // ==========================================================

  const addRule = () => {
    setForm(
      (previous) => ({
        ...previous,

        safety_rules: [
          ...previous.safety_rules,
          emptyRule(),
        ],
      })
    );
  };


  // ==========================================================
  // UPDATE SAFETY RULE
  // ==========================================================

  const updateRule = (
    index,
    key,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        safety_rules:
          previous.safety_rules.map(
            (
              rule,
              ruleIndex
            ) =>
              ruleIndex ===
              index
                ? {
                    ...rule,
                    [key]:
                      value,
                  }
                : rule
          ),
      })
    );
  };


  // ==========================================================
  // REMOVE SAFETY RULE
  // ==========================================================

  const removeRule = (
    index
  ) => {
    setForm(
      (previous) => ({
        ...previous,

        safety_rules:
          previous.safety_rules.filter(
            (
              _,
              ruleIndex
            ) =>
              ruleIndex !==
              index
          ),
      })
    );
  };


  // ==========================================================
  // SAVE REMEDY
  // ==========================================================

  const submit = async (
    event
  ) => {
    event.preventDefault();

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    const remedyName =
      form.name
        .trim();

    const diseaseName =
      form.disease
        .trim();

    const description =
      form.description
        .trim();

    const instructions =
      form.instructions
        .trim();

    if (!remedyName) {
      setToast(
        "Remedy name is required."
      );
      return;
    }

    if (!description) {
      setToast(
        "Description is required."
      );
      return;
    }

    if (!instructions) {
      setToast(
        "General guidelines / instructions are required."
      );
      return;
    }

    // --------------------------------------------------------
    // SAFETY RULE VALIDATION
    // --------------------------------------------------------

    const cleanedRules =
      form.safety_rules
        .filter(
          (rule) =>
            rule.condition_type &&
            rule.condition_value
        )
        .map(
          (rule) => ({
            ...rule,

            condition_type:
              String(
                rule.condition_type ||
                  ""
              ).trim(),

            condition_value:
              String(
                rule.condition_value ||
                  ""
              ).trim(),

            suitability:
              String(
                rule.suitability ||
                  "NOT_RECOMMENDED"
              )
                .trim()
                .toUpperCase(),

            severity:
              String(
                rule.severity ||
                  "MODERATE"
              ).trim(),

            reason:
              String(
                rule.reason ||
                  ""
              ).trim(),
          })
        );

    for (
      let index = 0;
      index <
      cleanedRules.length;
      index++
    ) {
      const rule =
        cleanedRules[
          index
        ];

      if (
        !rule.reason
      ) {
        setToast(
          `Medical safety reason is required for safety rule ${
            index + 1
          }.`
        );
        return;
      }
    }


    // --------------------------------------------------------
    // IMPORTANT:
    //
    // disease is intentionally sent as a STRING.
    //
    // It can be:
    //
    // "Dengue"
    // "Malaria"
    // "Diarrhea"
    // "Food Poisoning"
    // "Heat Exhaustion"
    // "Any disease manually entered by the supervisor"
    //
    // No registry lookup is required.
    // --------------------------------------------------------

    const payload = {
      name:
        remedyName,

      disease:
        diseaseName ||
        null,

      symptom:
        form.symptom
          .trim() ||
        null,

      aliases:
        form.aliases
          .trim() ||
        null,

      category:
        form.category
          .trim() ||
        "supportive_care",

      description:
        description,

      instructions:
        instructions,

      expected_benefit:
        form.expected_benefit
          .trim() ||
        null,

      medical_rationale:
        form.medical_rationale
          .trim() ||
        null,

      possible_side_effects:
        form.possible_side_effects
          .trim() ||
        null,

      general_safety_notes:
        form.general_safety_notes
          .trim() ||
        null,

      red_flags:
        form.red_flags
          .trim() ||
        null,

      when_to_seek_care:
        form.when_to_seek_care
          .trim() ||
        null,

      safety_rules:
        cleanedRules,
    };


    // --------------------------------------------------------
    // API SAVE
    // --------------------------------------------------------

    try {
      setSaving(true);

      if (editing) {
        await api.updateHomeRelief(
          editing.id,
          payload
        );
      } else {
        await api.createHomeRelief(
          payload
        );
      }

      setShowForm(false);
      setEditing(null);
      setForm(
        emptyForm()
      );

      await load();

      setToast(
        editing
          ? "Remedy updated and returned to review."
          : "Remedy created and queued for supervisor review."
      );
    } catch (error) {
      setToast(
        error?.message ||
          "Unable to save remedy."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // APPROVE
  // ==========================================================

  const approve = async (
    item
  ) => {
    try {
      await api.approveHomeRelief(
        item.id
      );

      await load();

      setToast(
        `${item.name} is now published.`
      );
    } catch (error) {
      setToast(
        error?.message ||
          "Unable to approve remedy."
      );
    }
  };


  // ==========================================================
  // REJECT
  // ==========================================================

  const reject = async (
    item
  ) => {
    const reason =
      window.prompt(
        "Reason for rejection:"
      );

    if (
      !reason ||
      !reason.trim()
    ) {
      return;
    }

    try {
      await api.rejectHomeRelief(
        item.id,
        reason.trim()
      );

      await load();

      setToast(
        "Remedy rejected with the recorded reason."
      );
    } catch (error) {
      setToast(
        error?.message ||
          "Unable to reject remedy."
      );
    }
  };


  // ==========================================================
  // DELETE
  // ==========================================================

  const remove = async (
    item
  ) => {
    const confirmed =
      window.confirm(
        `Delete “${item.name}” permanently?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteHomeRelief(
        item.id
      );

      await load();

      setToast(
        "Remedy deleted."
      );
    } catch (error) {
      setToast(
        error?.message ||
          "Unable to delete remedy."
      );
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="text-[27px] font-semibold tracking-[-.035em]">
          Home Relief
        </h1>

        <p className="mt-1 text-[12px] text-[#66727D]">
          Manage and verify safe supportive-care guidance
          for common symptoms and diseases.
        </p>
      </div>


      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="flex flex-wrap items-center gap-2">

        <button
          onClick={
            openCreate
          }
          className="inline-flex items-center gap-2 rounded-xl bg-[#087A32] px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-[#076A2C]"
        >
          <Plus size={15} />

          Add Remedy
        </button>


        <label className="flex h-10 min-w-[250px] flex-1 items-center gap-2 rounded-xl border border-[#DDE5E0] bg-white px-3">
          <Search
            size={15}
            className="text-[#7A8598]"
          />

          <input
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setPage(1);
            }}
            placeholder="Search remedy, disease, symptom…"
            className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
          />
        </label>


        {/* ====================================================
            DISEASE FILTER
        ==================================================== */}

        <FilterSelect
          value={
            disease
          }
          onChange={
            setDisease
          }
          options={[
            "All Diseases",
            ...diseaseOptions,
          ]}
        />


        {/* ====================================================
            CATEGORY FILTER
        ==================================================== */}

        <FilterSelect
          value={
            category
          }
          onChange={
            setCategory
          }
          options={[
            "All Categories",
            "supportive_care",
            "lifestyle",
            "hydration",
            "Supportive Care",
            "Lifestyle",
          ]}
        />


        {/* ====================================================
            STATUS FILTER
        ==================================================== */}

        <FilterSelect
          value={
            status
          }
          onChange={
            setStatus
          }
          options={[
            "All Status",
            "ACTIVE",
            "PENDING",
            "REJECTED",
            "INACTIVE",
          ]}
        />


        {/* ====================================================
            REFRESH
        ==================================================== */}

        <button
          onClick={
            load
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE5E0] bg-white hover:bg-[#F7FAF8]"
          title="Refresh"
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
        </button>

      </div>


      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        <Metric
          title="Total Remedies"
          value={
            stats.total
          }
          tone="green"
        />

        <Metric
          title="Published (Supervisor Vetted)"
          value={
            stats.published
          }
          tone="blue"
        />

        <Metric
          title="Drafts / Review"
          value={
            stats.drafts
          }
          tone="amber"
        />

      </div>


      {/* ======================================================
          REMEDY LIST
      ====================================================== */}

      <Panel title="Remedy List">

        <div className="overflow-x-auto rounded-xl border border-[#E7ECE9]">

          <table className="w-full min-w-[980px] text-left text-[10px]">

            <thead className="bg-[#FAFBFA] text-[#768295]">

              <tr>

                {[
                  "REMEDY NAME",
                  "DISEASE",
                  "SYMPTOM",
                  "CATEGORY",
                  "SAFETY",
                  "STATUS",
                  "UPDATED",
                  "ACTION",
                ].map(
                  (heading) => (
                    <th
                      key={
                        heading
                      }
                      className="px-3 py-3 text-[9px] font-bold"
                    >
                      {
                        heading
                      }
                    </th>
                  )
                )}

              </tr>

            </thead>


            <tbody>

              {visible.map(
                (item) => (

                  <tr
                    key={
                      item.id
                    }
                    className="border-t border-[#EEF1EF]"
                  >

                    <td className="px-3 py-3 font-semibold">
                      {
                        item.name
                      }
                    </td>


                    <td className="px-3 py-3">

                      {
                        item.disease ||
                        "—"
                      }

                    </td>


                    <td className="px-3 py-3">

                      {
                        item.symptom ||
                        "—"
                      }

                    </td>


                    <td className="px-3 py-3">

                      {
                        item.category
                      }

                    </td>


                    <td className="px-3 py-3">

                      {
                        item.safety_rules?.length ? (
                          <StatusBadge tone="amber">

                            {
                              item.safety_rules.length
                            }

                            {" "}

                            rule
                            {
                              item.safety_rules.length >
                              1
                                ? "s"
                                : ""
                            }

                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="green">
                            Safe
                          </StatusBadge>
                        )
                      }

                    </td>


                    <td className="px-3 py-3">

                      {
                        item.status ===
                        "ACTIVE" ? (
                          <StatusBadge tone="green">
                            Active
                          </StatusBadge>
                        ) : item.status ===
                          "REJECTED" ? (
                          <StatusBadge tone="red">
                            Rejected
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="amber">
                            Draft
                          </StatusBadge>
                        )
                      }

                    </td>


                    <td className="px-3 py-3">

                      {
                        item.updated_at
                          ? new Intl.DateTimeFormat(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            ).format(
                              new Date(
                                item.updated_at
                              )
                            )
                          : "—"
                      }

                    </td>


                    <td className="px-3 py-3">

                      <div className="flex items-center gap-1">

                        <button
                          onClick={() =>
                            setSelected(
                              item
                            )
                          }
                          className="rounded-lg border border-[#DDE5E0] px-2.5 py-1.5 hover:bg-[#F7FAF8]"
                        >
                          View
                        </button>


                        <button
                          onClick={() =>
                            openEdit(
                              item
                            )
                          }
                          className="rounded-lg border border-[#DDE5E0] p-1.5 hover:bg-[#F7FAF8]"
                          title="Edit"
                        >
                          <Pencil
                            size={13}
                          />
                        </button>


                        <button
                          onClick={() =>
                            remove(
                              item
                            )
                          }
                          className="rounded-lg border border-[#DDE5E0] p-1.5 text-[#C62828] hover:bg-[#FFF5F5]"
                          title="Delete"
                        >
                          <Trash2
                            size={13}
                          />
                        </button>


                        <button
                          onClick={() => {
                            if (
                              item.status ===
                              "ACTIVE"
                            ) {
                              return;
                            }

                            approve(
                              item
                            );
                          }}
                          className="rounded-lg border border-[#DDE5E0] p-1.5 text-[#087A32] hover:bg-[#F3FAF5] disabled:opacity-30"
                          disabled={
                            item.status ===
                            "ACTIVE"
                          }
                          title="Approve"
                        >
                          <CheckCircle2
                            size={13}
                          />
                        </button>


                        <button
                          onClick={() =>
                            reject(
                              item
                            )
                          }
                          className="rounded-lg border border-[#DDE5E0] p-1.5 text-[#C62828] hover:bg-[#FFF5F5]"
                          title="Reject"
                        >
                          <XCircle
                            size={13}
                          />
                        </button>


                        <button
                          className="rounded-lg border border-[#DDE5E0] p-1.5 hover:bg-[#F7FAF8]"
                          title="More options"
                        >
                          <MoreVertical
                            size={13}
                          />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>


          {!visible.length && (
            <div className="py-10 text-center text-[11px] text-[#718096]">
              No remedies match the current filters.
            </div>
          )}

        </div>


        {/* ====================================================
            PAGINATION
        ==================================================== */}

        <div className="flex items-center justify-between pt-4 text-[10px] text-[#718096]">

          <span>
            Showing{" "}
            {
              filtered.length
                ? (safePage - 1) *
                    perPage +
                  1
                : 0
            }
            –
            {
              Math.min(
                safePage *
                  perPage,
                filtered.length
              )
            }{" "}
            of{" "}
            {
              filtered.length
            }{" "}
            remedies
          </span>


          <div className="flex gap-1">

            {Array.from(
              {
                length:
                  pages,
              },
              (
                _,
                index
              ) =>
                index + 1
            )
              .slice(
                Math.max(
                  0,
                  safePage - 3
                ),
                safePage + 2
              )
              .map(
                (
                  pageNumber
                ) => (

                  <button
                    key={
                      pageNumber
                    }
                    onClick={() =>
                      setPage(
                        pageNumber
                      )
                    }
                    className={`h-8 min-w-8 rounded-lg border px-2 ${
                      pageNumber ===
                      safePage
                        ? "bg-[#087A32] text-white"
                        : "bg-white"
                    }`}
                  >
                    {
                      pageNumber
                    }
                  </button>

                )
              )}

          </div>

        </div>

      </Panel>


      {/* ======================================================
          IMPORTANT INFORMATION
      ====================================================== */}

      <div className="rounded-xl border border-[#DDEBE1] bg-[#F3FAF5] p-4 text-[10px] text-[#2D7047]">

        <ShieldCheck
          size={17}
          className="mb-1"
        />

        <b>
          Important:
        </b>{" "}

        All remedies must be evidence-informed and reviewed
        by a medical professional before publication. Ensure
        safety rules are added for high-risk populations.

      </div>


      {/* ======================================================
          ADD / EDIT DRAWER
      ====================================================== */}

      {showForm && (

        <Drawer
          title={
            editing
              ? "Edit Remedy"
              : "Add / Edit Remedy"
          }
          onClose={
            close
          }
        >

          <form
            onSubmit={
              submit
            }
            className="space-y-4"
          >

            {/* ==================================================
                REMEDY NAME + DISEASE
            ================================================== */}

            <div className="grid gap-3 sm:grid-cols-2">

              <Field label="Remedy name *">

                <input
                  required
                  value={
                    form.name
                  }
                  onChange={(event) =>
                    setField(
                      "name",
                      event.target.value
                    )
                  }
                  className="field"
                  placeholder="Enter remedy name"
                />

              </Field>


              {/* ==================================================
                  MANUAL DISEASE ENTRY
              ================================================== */}

              <Field label="Disease">

                <div className="relative">

                  <input
                    list="home-relief-disease-options"
                    value={
                      form.disease
                    }
                    onChange={(event) =>
                      setField(
                        "disease",
                        event.target.value
                      )
                    }
                    className="field pr-8"
                    placeholder="Select or enter disease"
                    autoComplete="off"
                  />


                  <datalist
                    id="home-relief-disease-options"
                  >

                    {diseaseOptions.map(
                      (
                        diseaseName
                      ) => (

                        <option
                          key={
                            diseaseName
                          }
                          value={
                            diseaseName
                          }
                        />

                      )
                    )}

                  </datalist>

                </div>


                <div className="mt-1 text-[9px] font-normal text-[#7A8598]">
                  Select an existing disease or type a new
                  disease manually.
                </div>

              </Field>

            </div>


            {/* ==================================================
                SYMPTOM
            ================================================== */}

            <Field label="Symptom">

              <input
                value={
                  form.symptom
                }
                onChange={(event) =>
                  setField(
                    "symptom",
                    event.target.value
                  )
                }
                className="field"
                placeholder="Enter symptom"
              />

            </Field>


            {/* ==================================================
                ALIASES
            ================================================== */}

            <Field label="Aliases">

              <input
                value={
                  form.aliases
                }
                onChange={(event) =>
                  setField(
                    "aliases",
                    event.target.value
                  )
                }
                className="field"
                placeholder="Comma-separated alternative names"
              />

            </Field>


            {/* ==================================================
                CATEGORY + EXPECTED BENEFIT
            ================================================== */}

            <div className="grid gap-3 sm:grid-cols-2">

              <Field label="Category *">

                <select
                  value={
                    form.category
                  }
                  onChange={(event) =>
                    setField(
                      "category",
                      event.target.value
                    )
                  }
                  className="field"
                >

                  <option value="supportive_care">
                    Supportive Care
                  </option>

                  <option value="lifestyle">
                    Lifestyle
                  </option>

                  <option value="hydration">
                    Hydration
                  </option>

                </select>

              </Field>


              <Field label="Expected supportive benefit">

                <textarea
                  value={
                    form.expected_benefit
                  }
                  onChange={(event) =>
                    setField(
                      "expected_benefit",
                      event.target.value
                    )
                  }
                  className="field min-h-[82px]"
                  placeholder="What benefit is expected?"
                />

              </Field>

            </div>


            {/* ==================================================
                DESCRIPTION + INSTRUCTIONS
            ================================================== */}

            <div className="grid gap-3 sm:grid-cols-2">

              <Field label="Description *">

                <textarea
                  required
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setField(
                      "description",
                      event.target.value
                    )
                  }
                  className="field min-h-[90px]"
                  placeholder="Brief description of the remedy"
                />

              </Field>


              <Field label="General guidelines / instructions *">

                <textarea
                  required
                  value={
                    form.instructions
                  }
                  onChange={(event) =>
                    setField(
                      "instructions",
                      event.target.value
                    )
                  }
                  className="field min-h-[90px]"
                  placeholder="How to use, dosage, frequency etc."
                />

              </Field>

            </div>


            {/* ==================================================
                MEDICAL RATIONALE + SAFETY NOTES
            ================================================== */}

            <div className="grid gap-3 sm:grid-cols-2">

              <Field label="Medical rationale">

                <textarea
                  value={
                    form.medical_rationale
                  }
                  onChange={(event) =>
                    setField(
                      "medical_rationale",
                      event.target.value
                    )
                  }
                  className="field min-h-[82px]"
                  placeholder="Why this remedy may help"
                />

              </Field>


              <Field label="General safety notes">

                <textarea
                  value={
                    form.general_safety_notes
                  }
                  onChange={(event) =>
                    setField(
                      "general_safety_notes",
                      event.target.value
                    )
                  }
                  className="field min-h-[82px]"
                  placeholder="General precautions & notes"
                />

              </Field>

            </div>


            {/* ==================================================
                SIDE EFFECTS + RED FLAGS
            ================================================== */}

            <div className="grid gap-3 sm:grid-cols-2">

              <Field label="Possible side effects / safety profile">

                <textarea
                  value={
                    form.possible_side_effects
                  }
                  onChange={(event) =>
                    setField(
                      "possible_side_effects",
                      event.target.value
                    )
                  }
                  className="field min-h-[82px]"
                  placeholder="Possible effects or interactions"
                />

              </Field>


              <Field label="Red flags">

                <textarea
                  value={
                    form.red_flags
                  }
                  onChange={(event) =>
                    setField(
                      "red_flags",
                      event.target.value
                    )
                  }
                  className="field min-h-[82px]"
                  placeholder="When to seek urgent care"
                />

              </Field>

            </div>


            {/* ==================================================
                WHEN TO SEEK CARE
            ================================================== */}

            <Field label="When to seek professional care">

              <textarea
                value={
                  form.when_to_seek_care
                }
                onChange={(event) =>
                  setField(
                    "when_to_seek_care",
                    event.target.value
                  )
                }
                className="field min-h-[70px]"
                placeholder="When to consult a doctor"
              />

            </Field>


            {/* ==================================================
                SAFETY RULES
            ================================================== */}

            <div className="rounded-xl border border-[#E7ECE9] p-3">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-[11px] font-semibold">
                    Safety rules
                  </div>

                  <div className="mt-0.5 text-[9px] text-[#718096]">
                    Add restrictions for special populations
                    or conditions.
                  </div>

                </div>


                <button
                  type="button"
                  onClick={
                    addRule
                  }
                  className="rounded-lg bg-[#087A32] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#076A2C]"
                >
                  + Add Rule
                </button>

              </div>


              {/* ==================================================
                  RULE LIST
              ================================================== */}

              <div className="mt-3 space-y-3">

                {form.safety_rules.map(
                  (
                    rule,
                    index
                  ) => (

                    <div
                      key={
                        index
                      }
                      className="rounded-xl bg-[#F7FAF8] p-3"
                    >

                      <div className="grid gap-2 sm:grid-cols-3">

                        {/* CONDITION TYPE */}

                        <select
                          value={
                            rule.condition_type
                          }
                          onChange={(event) =>
                            updateRule(
                              index,
                              "condition_type",
                              event.target.value
                            )
                          }
                          className="field"
                        >

                          <option value="">
                            Condition type
                          </option>

                          {CONDITIONS.map(
                            ([
                              value,
                              label,
                            ]) => (

                              <option
                                key={
                                  value
                                }
                                value={
                                  value
                                }
                              >
                                {
                                  label
                                }
                              </option>

                            )
                          )}

                        </select>


                        {/* CONDITION VALUE */}

                        <input
                          value={
                            rule.condition_value
                          }
                          onChange={(event) =>
                            updateRule(
                              index,
                              "condition_value",
                              event.target.value
                            )
                          }
                          className="field"
                          placeholder="Condition value"
                        />


                        {/* SUITABILITY */}

                        <select
                          value={
                            rule.suitability
                          }
                          onChange={(event) =>
                            updateRule(
                              index,
                              "suitability",
                              event.target.value
                            )
                          }
                          className="field"
                        >

                          <option value="SUITABLE">
                            Suitable
                          </option>

                          <option value="CAUTION">
                            Caution
                          </option>

                          <option value="NOT_RECOMMENDED">
                            Not Recommended
                          </option>

                          <option value="CONTRAINDICATED">
                            Do Not Use
                          </option>

                        </select>

                      </div>


                      {/* REASON */}

                      <div className="mt-2 flex gap-2">

                        <input
                          value={
                            rule.reason
                          }
                          onChange={(event) =>
                            updateRule(
                              index,
                              "reason",
                              event.target.value
                            )
                          }
                          className="field flex-1"
                          placeholder="Medical safety reason (required)"
                        />


                        <button
                          type="button"
                          onClick={() =>
                            removeRule(
                              index
                            )
                          }
                          className="rounded-lg border border-[#DDE5E0] p-2 text-[#C62828] hover:bg-[#FFF5F5]"
                          title="Remove safety rule"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* ==================================================
                FORM ACTIONS
            ================================================== */}

            <div className="flex gap-2 border-t pt-4">

              <button
                type="submit"
                disabled={
                  saving
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#087A32] px-4 py-3 text-[11px] font-semibold text-white disabled:opacity-50"
              >

                <Save
                  size={14}
                />

                {
                  saving
                    ? "Saving…"
                    : editing
                    ? "Save Changes"
                    : "Save Remedy"
                }

              </button>


              <button
                type="button"
                onClick={
                  close
                }
                className="rounded-xl border border-[#DDE5E0] px-5 text-[11px] font-semibold hover:bg-[#F7FAF8]"
              >
                Cancel
              </button>

            </div>

          </form>

        </Drawer>

      )}


      {/* ======================================================
          REMEDY DETAILS
      ====================================================== */}

      {selected && (

        <RemedyModal
          item={
            selected
          }
          onClose={() =>
            setSelected(
              null
            )
          }
        />

      )}


      {/* ======================================================
          TOAST
      ====================================================== */}

      <Toast
        message={
          toast
        }
        onClose={() =>
          setToast("")
        }
      />

    </div>
  );
}


// ============================================================
// METRIC
// ============================================================

function Metric({
  title,
  value,
  tone,
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "green"
          ? "border-[#DCEDE2] bg-[#F4FBF6]"
          : tone === "blue"
          ? "border-[#DCE7FA] bg-[#F5F8FF]"
          : "border-[#F4E4C8] bg-[#FFF9EF]"
      }`}
    >

      <div className="text-[10px] text-[#718096]">
        {
          title
        }
      </div>

      <div className="mt-1 text-[28px] font-semibold">
        {
          value
        }
      </div>

    </div>
  );
}


// ============================================================
// FILTER SELECT
// ============================================================

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <select
      value={
        value
      }
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-10 rounded-xl border border-[#DDE5E0] bg-white px-3 text-[10px] outline-none"
    >

      {options.map(
        (option) => (

          <option
            key={
              option
            }
            value={
              option
            }
          >
            {
              option
            }
          </option>

        )
      )}

    </select>
  );
}


// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  children,
}) {
  return (
    <label className="block text-[10px] font-semibold text-[#354357]">

      {
        label
      }

      <div className="mt-1">
        {
          children
        }
      </div>

    </label>
  );
}


// ============================================================
// DRAWER
// ============================================================

function Drawer({
  title,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#102A43]/20">

      <div className="h-full w-full max-w-[610px] overflow-y-auto border-l border-[#E1E7E3] bg-white shadow-2xl">

        {/* ==================================================
            DRAWER HEADER
        ================================================== */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#E7ECE9] bg-white p-5">

          <div>

            <div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#087A32]">
              Medical Content
            </div>

            <h2 className="mt-1 text-[19px] font-semibold">
              {
                title
              }
            </h2>

            <p className="mt-1 text-[10px] text-[#718096]">
              Fill in the details to add or update a remedy.
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg p-1 hover:bg-[#F4F7F5]"
          >
            <X
              size={18}
            />
          </button>

        </div>


        {/* ==================================================
            DRAWER CONTENT
        ================================================== */}

        <div className="p-5">
          {
            children
          }
        </div>

      </div>

    </div>
  );
}


// ============================================================
// REMEDY MODAL
// ============================================================

function RemedyModal({
  item,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#102A43]/25 p-4"
      onMouseDown={
        onClose
      }
    >

      <div
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="max-h-[85vh] w-full max-w-[650px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-start justify-between border-b border-[#E7ECE9] p-5">

          <div>

            <div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#087A32]">
              Remedy Details
            </div>

            <h3 className="mt-1 text-[19px] font-semibold">
              {
                item.name
              }
            </h3>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg p-1 hover:bg-[#F4F7F5]"
          >
            <X
              size={18}
            />
          </button>

        </div>


        {/* ==================================================
            BASIC INFORMATION
        ================================================== */}

        <div className="grid gap-3 p-5 sm:grid-cols-2">

          <Info
            label="Disease"
            value={
              item.disease ||
              "—"
            }
          />

          <Info
            label="Symptom"
            value={
              item.symptom ||
              "—"
            }
          />

          <Info
            label="Status"
            value={
              item.status
            }
          />

          <Info
            label="Category"
            value={
              item.category
            }
          />

        </div>


        {/* ==================================================
            DETAILS
        ================================================== */}

        <div className="space-y-3 px-5 pb-5">

          <Info
            label="Description"
            value={
              item.description
            }
          />

          <Info
            label="Instructions"
            value={
              item.instructions
            }
          />

          <Info
            label="Medical rationale"
            value={
              item.medical_rationale ||
              "—"
            }
          />

          <Info
            label="Expected supportive benefit"
            value={
              item.expected_benefit ||
              "—"
            }
          />

          <Info
            label="General safety notes"
            value={
              item.general_safety_notes ||
              "—"
            }
          />

          <Info
            label="Possible side effects / safety profile"
            value={
              item.possible_side_effects ||
              "—"
            }
          />

          <Info
            label="Red flags"
            value={
              item.red_flags ||
              "—"
            }
          />

          <Info
            label="When to seek professional care"
            value={
              item.when_to_seek_care ||
              "—"
            }
          />


          {/* ==================================================
              SAFETY RULES
          ================================================== */}

          <div className="rounded-xl border border-[#E7ECE9] p-3">

            <div className="text-[10px] font-semibold">
              Safety Rules
            </div>


            {(item.safety_rules || []).map(
              (
                rule,
                index
              ) => (

                <div
                  key={
                    rule.id ||
                    index
                  }
                  className="mt-2 rounded-lg bg-[#FFF7F7] p-3 text-[10px]"
                >

                  <b>
                    {
                      rule.condition_value
                    }
                  </b>

                  {" · "}

                  {
                    rule.suitability
                  }

                  <div className="mt-1 text-[#66727D]">
                    {
                      rule.reason ||
                      "No reason recorded."
                    }
                  </div>

                </div>

              )
            )}


            {!item.safety_rules?.length && (

              <div className="mt-2 text-[10px] text-[#718096]">
                No special restrictions recorded.
              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// INFO
// ============================================================

function Info({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-[#F7FAF8] p-3">

      <div className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8A93A3]">
        {
          label
        }
      </div>

      <div className="mt-1 whitespace-pre-wrap text-[10px] leading-4 text-[#354357]">
        {
          value
        }
      </div>

    </div>
  );
}