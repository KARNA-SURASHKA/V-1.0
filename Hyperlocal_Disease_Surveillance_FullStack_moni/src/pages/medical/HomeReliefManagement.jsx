import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";

import api from "../../api";

// ============================================================
// CONDITIONS
// ============================================================

const CONDITIONS = [
  {
    value: "pregnancy",
    label: "Pregnancy",
  },
  {
    value: "diabetes",
    label: "Diabetes",
  },
  {
    value: "kidney_disease",
    label: "Kidney Disease",
  },
  {
    value: "liver_disease",
    label: "Liver Disease",
  },
  {
    value: "hypertension",
    label: "Hypertension",
  },
  {
    value: "heart_disease",
    label: "Heart Disease",
  },
  {
    value: "asthma",
    label: "Asthma",
  },
  {
    value: "child",
    label: "Children",
  },
  {
    value: "infant",
    label: "Infants",
  },
  {
    value: "older_adult",
    label: "Older Adults",
  },
  {
    value: "breastfeeding",
    label: "Breastfeeding",
  },
  {
    value: "allergy",
    label: "Allergy / Sensitivity",
  },
  {
    value: "immunocompromised",
    label: "Immunocompromised",
  },
  {
    value: "medication_interaction",
    label: "Medication Interaction",
  },
];

// ============================================================
// STATUS OPTIONS
// ============================================================

const STATUS_OPTIONS = [
  {
    value: "SUITABLE",
    label: "Approved",
  },
  {
    value: "CAUTION",
    label: "Use With Caution",
  },
  {
    value: "NOT_RECOMMENDED",
    label: "Not Recommended",
  },
  {
    value: "CONTRAINDICATED",
    label: "Do Not Use",
  },
];

// ============================================================
// EMPTY SAFETY RULE
// ============================================================

function emptyRule() {
  return {
    id: null,
    condition_type: "pregnancy",
    condition_value: "Pregnancy",
    suitability: "NOT_RECOMMENDED",
    severity: "MODERATE",
    reason: "",
    alternative_remedy_id: null,
  };
}

// ============================================================
// EMPTY FORM
// ============================================================

function emptyForm() {
  return {
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
    alternatives: [],
  };
}

// ============================================================
// NORMALIZE ITEM INTO FORM
// ============================================================

function itemToForm(item) {
  if (!item) {
    return emptyForm();
  }

  return {
    name: item.name || "",
    disease: item.disease || "",
    symptom: item.symptom || "",
    aliases: item.aliases || "",
    category:
      item.category ||
      "supportive_care",

    description:
      item.description || "",

    instructions:
      item.instructions || "",

    expected_benefit:
      item.expected_benefit || "",

    medical_rationale:
      item.medical_rationale || "",

    possible_side_effects:
      item.possible_side_effects || "",

    general_safety_notes:
      item.general_safety_notes || "",

    red_flags:
      item.red_flags || "",

    when_to_seek_care:
      item.when_to_seek_care || "",

    safety_rules:
      Array.isArray(item.safety_rules)
        ? item.safety_rules.map((rule) => ({
            id: rule.id || null,

            condition_type:
              rule.condition_type ||
              "pregnancy",

            condition_value:
              rule.condition_value ||
              "",

            suitability:
              rule.suitability ||
              "NOT_RECOMMENDED",

            severity:
              rule.severity ||
              "MODERATE",

            reason:
              rule.reason || "",

            alternative_remedy_id:
              rule.alternative_remedy_id ??
              null,
          }))
        : [],

    alternatives:
      Array.isArray(item.alternatives)
        ? item.alternatives
        : [],
  };
}

// ============================================================
// HOME RELIEF MANAGEMENT
// ============================================================

export default function HomeReliefManagement() {
  const [items, setItems] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm());

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  // ==========================================================
  // LOAD ITEMS
  // ==========================================================

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const data =
        await api.getMedicalHomeReliefs();

      setItems(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load home relief records."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadItems();
  }, []);

  // ==========================================================
  // UPDATE FORM FIELD
  // ==========================================================

  function updateField(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================================
  // ADD SAFETY RULE
  // ==========================================================

  function addRule() {
    setForm((previous) => ({
      ...previous,

      safety_rules: [
        ...previous.safety_rules,
        emptyRule(),
      ],
    }));
  }

  // ==========================================================
  // REMOVE SAFETY RULE
  // ==========================================================

  function removeRule(index) {
    setForm((previous) => ({
      ...previous,

      safety_rules:
        previous.safety_rules.filter(
          (_, i) => i !== index
        ),
    }));
  }

  // ==========================================================
  // UPDATE SAFETY RULE
  // ==========================================================

  function updateRule(
    index,
    field,
    value
  ) {
    setForm((previous) => {
      const rules = [
        ...previous.safety_rules,
      ];

      rules[index] = {
        ...rules[index],
        [field]: value,
      };

      return {
        ...previous,
        safety_rules: rules,
      };
    });
  }

  // ==========================================================
  // OPEN CREATE FORM
  // ==========================================================

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  function openEditForm(item) {
    setEditingId(item.id);
    setForm(itemToForm(item));
    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  // ==========================================================
  // SUBMIT CREATE / UPDATE
  // ==========================================================

  async function submitForm(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      // ------------------------------------------------------
      // Clean safety rules before sending.
      // ------------------------------------------------------

      const cleanedRules =
        form.safety_rules
          .filter(
            (rule) =>
              rule.condition_type &&
              rule.condition_value &&
              rule.suitability &&
              rule.reason
          )
          .map((rule) => ({
            ...(rule.id
              ? {
                  id: rule.id,
                }
              : {}),

            condition_type:
              rule.condition_type,

            condition_value:
              rule.condition_value,

            suitability:
              rule.suitability,

            severity:
              rule.severity || "MODERATE",

            reason:
              rule.reason,

            alternative_remedy_id:
              rule.alternative_remedy_id ??
              null,
          }));

      const payload = {
        name: form.name.trim(),
        disease: form.disease.trim(),
        symptom: form.symptom.trim(),
        aliases: form.aliases.trim(),
        category:
          form.category ||
          "supportive_care",

        description:
          form.description.trim(),

        instructions:
          form.instructions.trim(),

        expected_benefit:
          form.expected_benefit.trim(),

        medical_rationale:
          form.medical_rationale.trim(),

        possible_side_effects:
          form.possible_side_effects.trim(),

        general_safety_notes:
          form.general_safety_notes.trim(),

        red_flags:
          form.red_flags.trim(),

        when_to_seek_care:
          form.when_to_seek_care.trim(),

        safety_rules:
          cleanedRules,

        alternatives:
          form.alternatives || [],
      };

      // ------------------------------------------------------
      // EDIT EXISTING REMEDY
      // ------------------------------------------------------

      if (editingId) {
        await api.updateHomeRelief(
          editingId,
          payload
        );
      }

      // ------------------------------------------------------
      // CREATE NEW REMEDY
      // ------------------------------------------------------

      else {
        await api.createHomeRelief(
          payload
        );
      }

      // ------------------------------------------------------
      // RESET
      // ------------------------------------------------------

      setForm(emptyForm());
      setShowForm(false);
      setEditingId(null);

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          (
            editingId
              ? "Unable to update home relief."
              : "Unable to save home relief."
          )
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // APPROVE
  // ==========================================================

  async function approve(id) {
    const confirmed =
      window.confirm(
        "Approve and publish this remedy? It will become available to users."
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.approveHomeRelief(id);

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to approve remedy."
      );
    }
  }

  // ==========================================================
  // REJECT
  // ==========================================================

  async function reject(id) {
    const reason =
      window.prompt(
        "Enter rejection reason:"
      );

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setError("");

      await api.rejectHomeRelief(
        id,
        reason.trim()
      );

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to reject remedy."
      );
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function deleteItem(item) {
    const confirmed =
      window.confirm(
        `Delete "${item.name}" permanently?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);
      setError("");

      await api.deleteHomeRelief(
        item.id
      );

      // If the deleted item was being edited,
      // close the editor.
      if (editingId === item.id) {
        setEditingId(null);
        setShowForm(false);
        setForm(emptyForm());
      }

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to delete remedy."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredItems =
    items.filter((item) => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        item.name
          ?.toLowerCase()
          .includes(query) ||
        item.disease
          ?.toLowerCase()
          .includes(query) ||
        item.symptom
          ?.toLowerCase()
          .includes(query) ||
        item.aliases
          ?.toLowerCase()
          .includes(query)
      );
    });

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h2 className="text-2xl font-semibold text-[#102A43]">
            Home Relief & Supportive Care
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Create, medically review, edit, publish,
            and manage temporary supportive-care information.
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={loadItems}
            disabled={loading}
            className="px-4 py-2 rounded-lg border
                       flex items-center gap-2
                       bg-white
                       disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-lg
                       bg-[#087A32] text-white
                       flex items-center gap-2
                       hover:bg-[#066B2B]"
          >

            <Plus size={17} />

            Add Home Relief

          </button>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="p-4 rounded-lg border
                     border-red-200
                     bg-red-50
                     text-red-700"
        >
          {error}
        </div>
      )}

      {/* ======================================================
          CREATE / EDIT FORM
      ====================================================== */}

      {showForm && (

        <form
          onSubmit={submitForm}
          className="border rounded-xl
                     bg-white p-6 space-y-6
                     shadow-sm"
        >

          {/* FORM HEADER */}

          <div className="flex items-start justify-between gap-4">

            <div>

              <h3 className="text-lg font-semibold text-[#102A43]">

                {editingId
                  ? "Edit Home Relief / Supportive Care"
                  : "Add Home Relief / Supportive Care"}

              </h3>

              <p className="text-sm text-gray-500 mt-1">

                {editingId
                  ? "Update the remedy and its medical safety information."
                  : "Every remedy must be medically reviewed before it becomes visible to users."}

              </p>

            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="p-2 rounded-lg
                         border hover:bg-gray-50
                         disabled:opacity-50"
              title="Close"
            >
              <X size={18} />
            </button>

          </div>

          {/* BASIC INFORMATION */}

          <div className="grid md:grid-cols-2 gap-4">

            <Field
              label="Remedy Name"
              value={form.name}
              onChange={(value) =>
                updateField(
                  "name",
                  value
                )
              }
              required
            />

            <Field
              label="Disease"
              value={form.disease}
              onChange={(value) =>
                updateField(
                  "disease",
                  value
                )
              }
            />

            <Field
              label="Symptom"
              value={form.symptom}
              onChange={(value) =>
                updateField(
                  "symptom",
                  value
                )
              }
            />

            <Field
              label="Aliases / Search Terms"
              value={form.aliases}
              onChange={(value) =>
                updateField(
                  "aliases",
                  value
                )
              }
            />

          </div>

          {/* CATEGORY */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Category
            </label>

            <select
              value={
                form.category ||
                "supportive_care"
              }
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value
                )
              }
              className="w-full border rounded-lg px-3 py-2"
            >

              <option value="supportive_care">
                Supportive Care
              </option>

              <option value="home_remedy">
                Home Remedy
              </option>

              <option value="self_care">
                Self Care
              </option>

            </select>

          </div>

          {/* DESCRIPTION */}

          <Textarea
            label="How it may help"
            value={form.description}
            onChange={(value) =>
              updateField(
                "description",
                value
              )
            }
            required
          />

          {/* INSTRUCTIONS */}

          <Textarea
            label="Instructions"
            value={form.instructions}
            onChange={(value) =>
              updateField(
                "instructions",
                value
              )
            }
            required
          />

          {/* EXPECTED BENEFIT */}

          <Textarea
            label="Expected Benefit"
            value={form.expected_benefit}
            onChange={(value) =>
              updateField(
                "expected_benefit",
                value
              )
            }
          />

          {/* MEDICAL RATIONALE */}

          <Textarea
            label="Medical Rationale"
            value={form.medical_rationale}
            onChange={(value) =>
              updateField(
                "medical_rationale",
                value
              )
            }
          />

          {/* SIDE EFFECTS */}

          <Textarea
            label="Possible Side Effects / Safety Profile"
            value={
              form.possible_side_effects
            }
            onChange={(value) =>
              updateField(
                "possible_side_effects",
                value
              )
            }
            required
          />

          {/* GENERAL SAFETY */}

          <Textarea
            label="General Safety Notes"
            value={
              form.general_safety_notes
            }
            onChange={(value) =>
              updateField(
                "general_safety_notes",
                value
              )
            }
            required
          />

          {/* RED FLAGS */}

          <Textarea
            label="Red Flags"
            value={form.red_flags}
            onChange={(value) =>
              updateField(
                "red_flags",
                value
              )
            }
          />

          {/* SEEK CARE */}

          <Textarea
            label="When to Seek Medical Care"
            value={
              form.when_to_seek_care
            }
            onChange={(value) =>
              updateField(
                "when_to_seek_care",
                value
              )
            }
            required
          />

          {/* ==================================================
              SAFETY RESTRICTIONS
          ================================================== */}

          <div className="border rounded-xl p-5">

            <div className="flex flex-wrap justify-between gap-3">

              <div>

                <h3 className="font-semibold text-[#102A43]">
                  Safety Restrictions
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Define contexts in which this remedy
                  should be restricted.
                </p>

              </div>

              <button
                type="button"
                onClick={addRule}
                className="px-3 py-2 rounded-lg
                           border flex gap-2
                           items-center
                           hover:bg-gray-50"
              >

                <Plus size={16} />

                Add Restriction

              </button>

            </div>

            <div className="mt-5 space-y-4">

              {form.safety_rules.length === 0 && (

                <div className="text-sm text-gray-500">
                  No special restrictions added.
                </div>

              )}

              {form.safety_rules.map(
                (rule, index) => (

                  <div
                    key={
                      rule.id ||
                      `new-rule-${index}`
                    }
                    className="border rounded-lg
                               p-4
                               grid md:grid-cols-2
                               gap-4"
                  >

                    {/* CONDITION */}

                    <div>

                      <label className="block text-sm font-medium mb-1">
                        Safety Context
                      </label>

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
                        className="w-full border rounded-lg px-3 py-2"
                      >

                        {CONDITIONS.map(
                          (condition) => (

                            <option
                              key={
                                condition.value
                              }
                              value={
                                condition.value
                              }
                            >
                              {
                                condition.label
                              }
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    {/* CONDITION DESCRIPTION */}

                    <Field
                      label="Context Description"
                      value={
                        rule.condition_value
                      }
                      onChange={(value) =>
                        updateRule(
                          index,
                          "condition_value",
                          value
                        )
                      }
                      required
                    />

                    {/* SUITABILITY */}

                    <div>

                      <label className="block text-sm font-medium mb-1">
                        Suitability
                      </label>

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
                        className="w-full border rounded-lg px-3 py-2"
                      >

                        {STATUS_OPTIONS.map(
                          (option) => (

                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    {/* SEVERITY */}

                    <Field
                      label="Severity"
                      value={
                        rule.severity
                      }
                      onChange={(value) =>
                        updateRule(
                          index,
                          "severity",
                          value
                        )
                      }
                    />

                    {/* REASON */}

                    <div className="md:col-span-2">

                      <Textarea
                        label="Safety Reason"
                        value={
                          rule.reason
                        }
                        onChange={(value) =>
                          updateRule(
                            index,
                            "reason",
                            value
                          )
                        }
                        required
                      />

                    </div>

                    {/* REMOVE */}

                    <div className="md:col-span-2 flex justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          removeRule(index)
                        }
                        className="text-red-600
                                   text-sm
                                   font-medium
                                   hover:text-red-800"
                      >
                        Remove Restriction
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

          {/* FORM ACTIONS */}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="px-4 py-2
                         rounded-lg
                         border
                         flex items-center gap-2
                         disabled:opacity-50"
            >

              <X size={16} />

              Cancel

            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2
                         rounded-lg
                         bg-[#087A32]
                         text-white
                         flex items-center gap-2
                         disabled:opacity-50"
            >

              {saving ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  {editingId
                    ? "Updating..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  {editingId ? (
                    <Save size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}

                  {editingId
                    ? "Update Remedy"
                    : "Save for Medical Review"}
                </>
              )}

            </button>

          </div>

        </form>

      )}

      {/* ======================================================
          RECORDS
      ====================================================== */}

      <div className="border rounded-xl bg-white">

        {/* RECORD HEADER */}

        <div className="p-5 border-b">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h3 className="font-semibold text-[#102A43]">
                Home Relief Records
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Medical Supervisor can edit or delete
                existing remedies.
              </p>

            </div>

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2
                           -translate-y-1/2
                           text-gray-400"
              />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search remedies..."
                className="w-[240px]
                           border rounded-lg
                           pl-9 pr-3 py-2
                           text-sm
                           outline-none
                           focus:border-[#087A32]"
              />

            </div>

          </div>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="p-8 text-center">
            Loading...
          </div>

        ) : filteredItems.length === 0 ? (

          <div className="p-8 text-center text-gray-500">

            {searchTerm
              ? "No remedies match your search."
              : "No Home Relief records available."}

          </div>

        ) : (

          <div className="divide-y">

            {filteredItems.map(
              (item) => (

                <div
                  key={item.id}
                  className="p-5"
                >

                  {/* =================================================
                      TOP ROW
                  ================================================= */}

                  <div className="flex justify-between gap-4">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h4 className="font-semibold text-[#102A43]">
                          {item.name}
                        </h4>

                        <StatusBadge
                          status={
                            item.status
                          }
                        />

                      </div>

                      <p className="text-sm text-gray-500 mt-1">

                        {item.disease ||
                          item.symptom ||
                          "General supportive care"}

                        {item.disease &&
                          item.symptom &&
                          ` · ${item.symptom}`}

                      </p>

                    </div>

                    {/* =================================================
                        MANAGEMENT ACTIONS
                    ================================================= */}

                    <div className="flex flex-wrap gap-2">

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(item)
                        }
                        className="px-3 py-2
                                   rounded-lg
                                   border
                                   text-[#315C88]
                                   flex items-center
                                   gap-2
                                   hover:bg-[#F5F8FB]"
                      >

                        <Pencil size={15} />

                        Edit

                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          item.id
                        }
                        onClick={() =>
                          deleteItem(item)
                        }
                        className="px-3 py-2
                                   rounded-lg
                                   border
                                   border-red-200
                                   text-red-600
                                   flex items-center
                                   gap-2
                                   hover:bg-red-50
                                   disabled:opacity-50"
                      >

                        {deletingId ===
                        item.id ? (
                          <RefreshCw
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={15}
                          />
                        )}

                        Delete

                      </button>

                    </div>

                  </div>

                  {/* =================================================
                      DESCRIPTION
                  ================================================= */}

                  <p className="text-sm mt-3 text-[#52606D]">
                    {item.description ||
                      "No description provided."}
                  </p>

                  {/* =================================================
                      INSTRUCTIONS
                  ================================================= */}

                  {item.instructions && (

                    <div className="mt-3">

                      <p className="text-xs font-semibold text-[#102A43]">
                        Instructions
                      </p>

                      <p className="text-sm mt-1 text-[#52606D] whitespace-pre-line">
                        {item.instructions}
                      </p>

                    </div>

                  )}

                  {/* =================================================
                      SAFETY RULES
                  ================================================= */}

                  {item.safety_rules?.length >
                    0 && (

                    <div className="mt-4">

                      <p className="text-sm font-medium">
                        Safety restrictions:
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">

                        {item.safety_rules.map(
                          (rule) => (

                            <span
                              key={
                                rule.id ||
                                `${item.id}-${rule.condition_type}-${rule.condition_value}`
                              }
                              className={`text-xs px-2 py-1
                                         rounded-full
                                         ${
                                           rule.suitability ===
                                           "CONTRAINDICATED"
                                             ? "bg-red-100 text-red-700"
                                             : rule.suitability ===
                                               "NOT_RECOMMENDED"
                                             ? "bg-orange-100 text-orange-700"
                                             : rule.suitability ===
                                               "CAUTION"
                                             ? "bg-yellow-100 text-yellow-700"
                                             : "bg-green-100 text-green-700"
                                         }`}
                            >

                              {rule.condition_type}

                              {" — "}

                              {rule.suitability}

                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                      APPROVE / REJECT
                  ================================================= */}

                  {item.status ===
                    "PENDING" && (

                    <div className="flex flex-wrap gap-3 mt-5">

                      <button
                        type="button"
                        onClick={() =>
                          approve(
                            item.id
                          )
                        }
                        className="px-4 py-2
                                   rounded-lg
                                   bg-green-600
                                   text-white
                                   flex gap-2
                                   items-center
                                   hover:bg-green-700"
                      >

                        <CheckCircle
                          size={16}
                        />

                        Approve & Publish

                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          reject(
                            item.id
                          )
                        }
                        className="px-4 py-2
                                   rounded-lg
                                   border
                                   text-red-600
                                   flex gap-2
                                   items-center
                                   hover:bg-red-50"
                      >

                        <XCircle
                          size={16}
                        />

                        Reject

                      </button>

                    </div>

                  )}

                </div>

              )
            )}

          </div>

        )}

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
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium mb-1">

        {label}

        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}

      </label>

      <input
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        required={required}
        className="w-full border rounded-lg
                   px-3 py-2
                   outline-none
                   focus:border-[#087A32]"
      />

    </div>
  );
}

// ============================================================
// TEXTAREA
// ============================================================

function Textarea({
  label,
  value,
  onChange,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium mb-1">

        {label}

        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}

      </label>

      <textarea
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        required={required}
        rows={4}
        className="w-full border rounded-lg
                   px-3 py-2
                   outline-none
                   focus:border-[#087A32]"
      />

    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {
  const normalized =
    (status || "")
      .toUpperCase();

  if (normalized === "ACTIVE") {
    return (
      <span
        className="px-3 py-1 rounded-full
                   text-xs bg-green-100
                   text-green-700
                   flex items-center gap-1"
      >
        <ShieldCheck size={14} />

        Published
      </span>
    );
  }

  if (normalized === "PENDING") {
    return (
      <span
        className="px-3 py-1 rounded-full
                   text-xs bg-yellow-100
                   text-yellow-700
                   flex items-center gap-1"
      >
        <AlertTriangle size={14} />

        Pending Review
      </span>
    );
  }

  if (normalized === "REJECTED") {
    return (
      <span
        className="px-3 py-1 rounded-full
                   text-xs bg-red-100
                   text-red-700
                   flex items-center gap-1"
      >
        <XCircle size={14} />

        Rejected
      </span>
    );
  }

  if (normalized === "INACTIVE") {
    return (
      <span
        className="px-3 py-1 rounded-full
                   text-xs bg-gray-100
                   text-gray-700"
      >
        Inactive
      </span>
    );
  }

  return (
    <span
      className="px-3 py-1 rounded-full
                 text-xs bg-gray-100
                 text-gray-700"
    >
      {status || "Unknown"}
    </span>
  );
}