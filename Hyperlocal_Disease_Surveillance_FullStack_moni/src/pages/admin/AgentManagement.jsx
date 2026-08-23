import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Power,
  AlertTriangle,
} from "lucide-react";

import {
  api,
} from "../../api";

import LocationSelector
  from "../../components/LocationSelector";


export default function AgentManagement({
  location,
}) {

  const [
    agents,
    setAgents,
  ] = useState([]);


  const [
    error,
    setError,
  ] = useState("");


  const [
    showAdd,
    setShowAdd,
  ] = useState(false);


  const [
    editingId,
    setEditingId,
  ] = useState(null);


  const [
    actionAgent,
    setActionAgent,
  ] = useState(null);


  const [
    actionType,
    setActionType,
  ] = useState(null);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);


  // ==========================================================
  // LOAD AGENTS FROM DATABASE
  // ==========================================================

  const loadAgents = async () => {

    try {

      setError("");

      const data =
        await api.listAgents({
          state_id:
            location.state?.id,

          district_id:
            location.district?.id,

          taluk_id:
            location.taluk?.id,
        });

      setAgents(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      setError(
        err?.message ||
        "Unable to load agents."
      );
    }
  };


  // ==========================================================
  // LOAD ON PAGE OPEN / LOCATION CHANGE
  // ==========================================================

  useEffect(() => {

    loadAgents();

  }, [
    location.state?.id,
    location.district?.id,
    location.taluk?.id,
  ]);


  // ==========================================================
  // OPEN STATUS CONFIRMATION
  // ==========================================================

  const openStatusConfirmation = (
    agent,
    type
  ) => {

    setError("");

    setActionAgent(agent);

    setActionType(type);
  };


  // ==========================================================
  // OPEN DELETE CONFIRMATION
  // ==========================================================

  const openDeleteConfirmation = (
    agent
  ) => {

    setError("");

    setActionAgent(agent);

    setActionType("delete");
  };


  // ==========================================================
  // CLOSE CONFIRMATION
  // ==========================================================

  const closeConfirmation = () => {

    if (actionLoading) {
      return;
    }

    setActionAgent(null);

    setActionType(null);
  };


  // ==========================================================
  // CONFIRM ACTION
  // ==========================================================

  const handleConfirmedAction = async () => {

    if (
      !actionAgent ||
      !actionType
    ) {
      return;
    }


    try {

      setActionLoading(true);

      setError("");


      // ------------------------------------------------------
      // DEACTIVATE
      // ------------------------------------------------------

      if (
        actionType === "deactivate"
      ) {

        await api.updateAgentStatus(
          actionAgent.id,
          false
        );

      }


      // ------------------------------------------------------
      // ACTIVATE
      // ------------------------------------------------------

      if (
        actionType === "activate"
      ) {

        await api.updateAgentStatus(
          actionAgent.id,
          true
        );

      }


      // ------------------------------------------------------
      // DELETE
      // ------------------------------------------------------

      if (
        actionType === "delete"
      ) {

        await api.deleteAgent(
          actionAgent.id
        );

      }


      // ------------------------------------------------------
      // CLOSE MODAL
      // ------------------------------------------------------

      setActionAgent(null);

      setActionType(null);


      // ------------------------------------------------------
      // REFRESH AGENTS
      // ------------------------------------------------------

      await loadAgents();

    } catch (err) {

      setError(
        err?.message ||
        "Unable to complete this action."
      );

    } finally {

      setActionLoading(false);
    }
  };


  // ==========================================================
  // CONFIRMATION CONTENT
  // ==========================================================

  const getConfirmationContent = () => {

    if (
      !actionAgent ||
      !actionType
    ) {
      return null;
    }


    if (
      actionType === "deactivate"
    ) {

      return {
        title: "Deactivate Agent?",

        description:
          `Are you sure you want to deactivate ${actionAgent.full_name}?`,

        details:
          "The agent will no longer be able to log in or submit reports. Existing surveillance records will be preserved.",

        confirmText: "Deactivate",

        confirmClass:
          "bg-[#C9772A] hover:bg-[#B96820]",

        icon: (
          <Power
            size={22}
          />
        ),
      };
    }


    if (
      actionType === "activate"
    ) {

      return {
        title: "Activate Agent?",

        description:
          `Are you sure you want to activate ${actionAgent.full_name}?`,

        details:
          "The agent will be able to log in and use the Agent Portal again.",

        confirmText: "Activate",

        confirmClass:
          "bg-[#0B7A33] hover:bg-[#0B6D2E]",

        icon: (
          <CheckCircle2
            size={22}
          />
        ),
      };
    }


    if (
      actionType === "delete"
    ) {

      return {
        title: "Delete Agent?",

        description:
          `Are you sure you want to permanently delete ${actionAgent.full_name}?`,

        details:
          "This action cannot be undone. Agents with existing disease reports may need to be deactivated instead so surveillance history is preserved.",

        confirmText: "Delete",

        confirmClass:
          "bg-[#C62828] hover:bg-[#B71C1C]",

        icon: (
          <Trash2
            size={22}
          />
        ),
      };
    }


    return null;
  };


  const confirmation =
    getConfirmationContent();


  return (
    <div>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          mb-5
        "
      >

        <div>

          <h2
            className="
              text-[20px]
              font-semibold
              text-[#1F3144]
            "
          >
            Agent Management
          </h2>


          <p
            className="
              mt-1
              text-[13px]
              text-[#7A8598]
            "
          >
            Create and manage field agent accounts.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            setShowAdd(true)
          }
          className="
            flex
            items-center
            gap-2
            rounded-lg
            bg-[#0B7A33]
            px-4
            py-2.5
            text-[14px]
            font-medium
            text-white
            transition-colors
            hover:bg-[#0B6D2E]
          "
        >

          <Plus
            size={17}
          />

          Add Agent

        </button>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="
            mb-4
            flex
            items-start
            gap-2
            rounded-lg
            bg-[#FBEAEA]
            px-3
            py-2
            text-[13px]
            text-[#C62828]
          "
        >

          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0"
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ====================================================
          AGENTS TABLE
      ==================================================== */}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-[#E8E2D8]
          bg-white
        "
      >

        <div className="overflow-x-auto">

          <table
            className="
              w-full
              text-[14px]
            "
          >

            <thead
              className="
                bg-[#F6F3ED]
                text-left
                text-[#445064]
              "
            >

              <tr>

                <th
                  className="
                    px-4
                    py-3
                    font-medium
                  "
                >
                  Agent
                </th>


                <th
                  className="
                    px-4
                    py-3
                    font-medium
                  "
                >
                  Username
                </th>


                <th
                  className="
                    px-4
                    py-3
                    font-medium
                  "
                >
                  Assigned Taluk
                </th>


                <th
                  className="
                    px-4
                    py-3
                    font-medium
                  "
                >
                  Status
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-right
                    font-medium
                  "
                >
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {agents.map(
                (agent) => (

                  <tr
                    key={agent.id}
                    className="
                      border-t
                      border-[#E8E2D8]
                    "
                  >

                    {/* ========================================
                        AGENT
                    ======================================== */}

                    <td
                      className="
                        px-4
                        py-3
                        font-medium
                        text-[#1F3144]
                      "
                    >
                      {agent.full_name}
                    </td>


                    {/* ========================================
                        USERNAME
                    ======================================== */}

                    <td
                      className="
                        px-4
                        py-3
                        text-[#7A8598]
                      "
                    >
                      {agent.username}
                    </td>


                    {/* ========================================
                        TALUK
                    ======================================== */}

                    <td
                      className="
                        px-4
                        py-3
                        text-[#1F3144]
                      "
                    >
                      {agent.taluk_name}
                    </td>


                    {/* ========================================
                        STATUS
                    ======================================== */}

                    <td
                      className="
                        px-4
                        py-3
                      "
                    >

                      {Boolean(
                        agent.is_active
                      ) ? (

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-[#EAF6EE]
                            px-2.5
                            py-1
                            text-[12px]
                            font-medium
                            text-[#0B7A33]
                          "
                        >

                          <CheckCircle2
                            size={14}
                          />

                          Active

                        </span>

                      ) : (

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-[#FBEAEA]
                            px-2.5
                            py-1
                            text-[12px]
                            font-medium
                            text-[#C62828]
                          "
                        >

                          <XCircle
                            size={14}
                          />

                          Inactive

                        </span>

                      )}

                    </td>


                    {/* ========================================
                        ACTIONS
                    ======================================== */}

                    <td
                      className="
                        px-4
                        py-3
                        text-right
                      "
                    >

                      <div
                        className="
                          flex
                          justify-end
                          gap-2
                        "
                      >

                        {/* ==================================
                            EDIT
                        ================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            setEditingId(
                              agent.id
                            )
                          }
                          title="Edit Agent"
                          className="
                            rounded-lg
                            p-2
                            text-[#445064]
                            hover:bg-[#F6F3ED]
                          "
                        >

                          <Pencil
                            size={16}
                          />

                        </button>


                        {/* ==================================
                            ACTIVATE / DEACTIVATE
                        ================================== */}

                        {Boolean(
                          agent.is_active
                        ) ? (

                          <button
                            type="button"
                            onClick={() =>
                              openStatusConfirmation(
                                agent,
                                "deactivate"
                              )
                            }
                            title="Deactivate Agent"
                            className="
                              rounded-lg
                              p-2
                              text-[#C9772A]
                              hover:bg-[#FFF4E8]
                            "
                          >

                            <Power
                              size={16}
                            />

                          </button>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              openStatusConfirmation(
                                agent,
                                "activate"
                              )
                            }
                            title="Activate Agent"
                            className="
                              rounded-lg
                              p-2
                              text-[#0B7A33]
                              hover:bg-[#EAF6EE]
                            "
                          >

                            <CheckCircle2
                              size={16}
                            />

                          </button>

                        )}


                        {/* ==================================
                            DELETE
                        ================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteConfirmation(
                              agent
                            )
                          }
                          title="Delete Agent"
                          className="
                            rounded-lg
                            p-2
                            text-[#C62828]
                            hover:bg-[#FBEAEA]
                          "
                        >

                          <Trash2
                            size={16}
                          />

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}


              {/* ============================================
                  EMPTY STATE
              ============================================ */}

              {agents.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      px-4
                      py-8
                      text-center
                      text-[#7A8598]
                    "
                  >
                    No agents found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ====================================================
          ADD AGENT MODAL
      ==================================================== */}

      {showAdd && (

        <AddAgentModal

          onClose={() =>
            setShowAdd(false)
          }

          onCreated={async () => {

            setShowAdd(false);

            await loadAgents();

          }}

        />

      )}


      {/* ====================================================
          EDIT AGENT MODAL
      ==================================================== */}

      {editingId && (

        <EditAgentModal

          agent={
            agents.find(
              (agent) =>
                agent.id === editingId
            )
          }

          onClose={() =>
            setEditingId(null)
          }

          onSaved={async () => {

            setEditingId(null);

            await loadAgents();

          }}

        />

      )}


      {/* ====================================================
          CONFIRMATION MODAL
      ==================================================== */}

      {confirmation && (

        <ConfirmationModal

          title={
            confirmation.title
          }

          description={
            confirmation.description
          }

          details={
            confirmation.details
          }

          confirmText={
            confirmation.confirmText
          }

          confirmClass={
            confirmation.confirmClass
          }

          icon={
            confirmation.icon
          }

          loading={
            actionLoading
          }

          onCancel={
            closeConfirmation
          }

          onConfirm={
            handleConfirmedAction
          }

        />

      )}

    </div>
  );
}


/* ============================================================
   ADD AGENT MODAL
============================================================ */

function AddAgentModal({
  onClose,
  onCreated,
}) {

  const [
    form,
    setForm,
  ] = useState({
    username: "",
    password: "",
    full_name: "",
  });


  const [
    talukId,
    setTalukId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  // ==========================================================
  // HANDLE TALUK SELECTION
  // ==========================================================

  const handleLocationChange = (
    selectedLocation
  ) => {

    if (
      selectedLocation?.talukId
    ) {

      setTalukId(
        Number(
          selectedLocation.talukId
        )
      );

    } else {

      setTalukId(null);

    }

    // Clear the previous validation
    // message once a valid taluk is selected.
    if (
      selectedLocation?.talukId
    ) {

      setError("");

    }
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    if (
      !form.full_name.trim()
    ) {

      setError(
        "Please enter the agent's full name."
      );

      return;
    }


    if (
      !form.username.trim()
    ) {

      setError(
        "Please enter a username."
      );

      return;
    }


    if (
      !form.password
    ) {

      setError(
        "Please enter a password."
      );

      return;
    }


    if (!talukId) {

      setError(
        "Please select a taluk to assign."
      );

      return;
    }


    try {

      setSaving(true);

      setError("");


      const createdAgent =
        await api.createAgent({

          full_name:
            form.full_name.trim(),

          username:
            form.username.trim(),

          password:
            form.password,

          taluk_id:
            Number(talukId),

        });


      console.log(
        "Agent created:",
        createdAgent
      );


      await onCreated();

    } catch (err) {

      setError(
        err?.message ||
        "Unable to create agent."
      );

    } finally {

      setSaving(false);
    }
  };


  return (

    <Modal
      onClose={onClose}
      title="Add Agent"
    >

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {error && (

          <div
            className="
              rounded-lg
              bg-[#FBEAEA]
              px-3
              py-2
              text-[13px]
              text-[#C62828]
            "
          >
            {error}
          </div>

        )}


        <Field label="Full Name">

          <input
            required
            type="text"
            value={
              form.full_name
            }
            onChange={(event) =>
              setForm({
                ...form,
                full_name:
                  event.target.value,
              })
            }
            className="input"
            placeholder="Enter agent name"
          />

        </Field>


        <Field label="Username">

          <input
            required
            type="text"
            value={
              form.username
            }
            onChange={(event) =>
              setForm({
                ...form,
                username:
                  event.target.value,
              })
            }
            className="input"
            placeholder="Enter login username"
          />

        </Field>


        <Field label="Password">

          <input
            required
            type="password"
            value={
              form.password
            }
            onChange={(event) =>
              setForm({
                ...form,
                password:
                  event.target.value,
              })
            }
            className="input"
            placeholder="Enter login password"
          />

        </Field>


        <Field label="Assign Taluk">

          <LocationSelector
            onChange={
              handleLocationChange
            }
          />

        </Field>


        <button
          type="submit"
          disabled={saving}
          className="
            w-full
            rounded-xl
            bg-[#0B7A33]
            px-4
            py-3
            text-[14px]
            font-semibold
            text-white
            transition
            hover:bg-[#0B6D2E]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          {saving
            ? "Creating Agent..."
            : "Create Agent"}

        </button>

      </form>

    </Modal>
  );
}


/* ============================================================
   EDIT AGENT MODAL
============================================================ */

function EditAgentModal({
  agent,
  onClose,
  onSaved,
}) {

  const [
    fullName,
    setFullName,
  ] = useState(
    agent?.full_name || ""
  );


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  if (!agent) {
    return null;
  }


  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setSaving(true);

    setError("");


    try {

      const payload = {
        full_name:
          fullName.trim(),
      };


      if (password) {

        payload.password =
          password;

      }


      await api.updateAgent(
        agent.id,
        payload
      );


      await onSaved();

    } catch (err) {

      setError(
        err?.message ||
        "Unable to update agent."
      );

    } finally {

      setSaving(false);
    }
  };


  return (

    <Modal
      onClose={onClose}
      title={`Edit Agent — ${agent.taluk_name}`}
    >

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {error && (

          <div
            className="
              rounded-lg
              bg-[#FBEAEA]
              px-3
              py-2
              text-[13px]
              text-[#C62828]
            "
          >
            {error}
          </div>

        )}


        <Field label="Full Name">

          <input
            required
            className="input"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
            }
          />

        </Field>


        <Field label="New Password">

          <input
            type="password"
            className="input"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Leave blank to keep current password"
          />

        </Field>


        <button
          type="submit"
          disabled={saving}
          className="
            w-full
            rounded-xl
            bg-[#0B7A33]
            px-4
            py-3
            text-[14px]
            font-semibold
            text-white
            hover:bg-[#0B6D2E]
            disabled:opacity-60
          "
        >

          {saving
            ? "Saving..."
            : "Save Changes"}

        </button>

      </form>

    </Modal>
  );
}


/* ============================================================
   CONFIRMATION MODAL
============================================================ */

function ConfirmationModal({
  title,
  description,
  details,
  confirmText,
  confirmClass,
  icon,
  loading,
  onCancel,
  onConfirm,
}) {

  return (

    <div
      className="
        fixed
        inset-0
        z-[60]
        flex
        items-center
        justify-center
        bg-black/40
        px-4
      "
    >

      <div
        className="
          w-full
          max-w-[460px]
          rounded-2xl
          bg-white
          p-6
          shadow-xl
        "
      >

        {/* ==================================================
            ICON + CLOSE
        ================================================== */}

        <div
          className="
            mb-5
            flex
            items-start
            justify-between
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-[#F6F3ED]
              text-[#445064]
            "
          >

            {icon}

          </div>


          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-lg
              p-1.5
              text-[#445064]
              transition
              hover:bg-[#F6F3ED]
              disabled:opacity-50
            "
          >

            <X
              size={18}
            />

          </button>

        </div>


        {/* ==================================================
            TITLE
        ================================================== */}

        <h3
          className="
            text-[19px]
            font-semibold
            text-[#1F3144]
          "
        >
          {title}
        </h3>


        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <p
          className="
            mt-2
            text-[14px]
            leading-6
            text-[#445064]
          "
        >
          {description}
        </p>


        {/* ==================================================
            DETAILS
        ================================================== */}

        <div
          className="
            mt-4
            rounded-xl
            bg-[#F6F3ED]
            px-4
            py-3
            text-[13px]
            leading-5
            text-[#7A8598]
          "
        >
          {details}
        </div>


        {/* ==================================================
            BUTTONS
        ================================================== */}

        <div
          className="
            mt-6
            flex
            justify-end
            gap-3
          "
        >

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-xl
              border
              border-[#E8E2D8]
              bg-white
              px-4
              py-2.5
              text-[14px]
              font-medium
              text-[#445064]
              transition
              hover:bg-[#F6F3ED]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            Cancel
          </button>


          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`
              rounded-xl
              px-4
              py-2.5
              text-[14px]
              font-semibold
              text-white
              transition
              disabled:cursor-not-allowed
              disabled:opacity-60
              ${confirmClass}
            `}
          >

            {loading
              ? "Please wait..."
              : confirmText}

          </button>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  children,
}) {

  return (

    <label className="block">

      <span
        className="
          mb-1.5
          block
          text-[11px]
          font-semibold
          uppercase
          tracking-[0.08em]
          text-[#7A8598]
        "
      >
        {label}
      </span>


      {children}

    </label>
  );
}


/* ============================================================
   MODAL
============================================================ */

function Modal({
  title,
  onClose,
  children,
}) {

  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        px-4
      "
    >

      <div
        className="
          max-h-[90vh]
          w-full
          max-w-[520px]
          overflow-y-auto
          rounded-2xl
          bg-white
          p-6
        "
      >

        <div
          className="
            mb-4
            flex
            items-center
            justify-between
          "
        >

          <h3
            className="
              text-[18px]
              font-semibold
              text-[#1F3144]
            "
          >
            {title}
          </h3>


          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-1.5
              text-[#445064]
              hover:bg-[#F6F3ED]
            "
          >

            <X
              size={18}
            />

          </button>

        </div>


        {children}

      </div>

    </div>
  );
}