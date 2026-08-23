import {
  useEffect,
  useState,
} from "react";

import { api } from "../../api";

const TYPES = [
  "Health Camp",
  "Awareness Campaign",
  "Emergency Alert",
];

export default function NotificationsPanel({
  location,
}) {
  const [notes, setNotes] =
    useState([]);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      title: "",
      message: "",
      type: TYPES[0],
    });

  const [statewide, setStatewide] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const load = () => {

    setError("");

    return api
      .listAdminNotifications({
        state_id:
          location.state?.id,
        district_id:
          location.district?.id,
        taluk_id:
          location.taluk?.id,
      })

      .then(setNotes)

      .catch((e) =>
        setError(e.message)
      );
  };

  useEffect(() => {

    load();

  }, [
    location.state?.id,
    location.district?.id,
    location.taluk?.id,
  ]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setSaving(true);
    setError("");

    try {

      if (
        !statewide &&
        !location.taluk?.id
      ) {
        throw new Error(
          "Select a taluk in the Admin location selector before publishing a taluk-specific notification."
        );
      }

      await api.createNotification({
        ...form,
        taluk_id: statewide
          ? null
          : location.taluk.id,
      });

      setForm({
        title: "",
        message: "",
        type: TYPES[0],
      });

      await load();

    } catch (err) {

      setError(err.message);

    } finally {

      setSaving(false);

    }
  };

  const selectedScope =
    location.taluk?.name ||
    location.district?.name ||
    location.state?.name ||
    "All available locations";

  return (
    <div>

      <div className="mb-5">

        <h2 className="text-[20px] font-semibold text-[#1F3144]">
          Notifications
        </h2>

        <p className="text-[13px] text-[#7A8598] mt-1">
          Publish health communication for users and review recent notifications.
        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div>

          <h3 className="text-[17px] font-semibold text-[#1F3144] mb-3">
            Publish Notification
          </h3>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-[#E8E2D8] p-6 space-y-4"
          >

            {error && (
              <p className="text-[13px] text-[#C62828] bg-[#FBEAEA] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>

              <label className="block text-[13px] font-medium text-[#445064] mb-1">
                Type
              </label>

              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
              >

                {TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}

              </select>

            </div>

            <div>

              <label className="block text-[13px] font-medium text-[#445064] mb-1">
                Title
              </label>

              <input
                required
                className="input"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block text-[13px] font-medium text-[#445064] mb-1">
                Message
              </label>

              <textarea
                required
                rows={4}
                className="input"
                value={form.message}
                onChange={(e) =>
                  setForm({
                    ...form,
                    message: e.target.value,
                  })
                }
              />

            </div>

            <div className="flex items-start gap-2">

              <input
                type="checkbox"
                id="statewide"
                checked={statewide}
                onChange={(e) =>
                  setStatewide(
                    e.target.checked
                  )
                }
                className="mt-1"
              />

              <div>

                <label
                  htmlFor="statewide"
                  className="text-[13px] font-medium text-[#445064]"
                >
                  Statewide notification
                </label>

                <p className="text-[11px] text-[#9A9489] mt-0.5">
                  When disabled, the notification targets the selected taluk.
                </p>

              </div>

            </div>

            {!statewide && (

              <div className="rounded-xl border border-[#E8E2D8] bg-[#F6F3ED] px-4 py-3">

                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#9A9489]">
                  Target Taluk
                </p>

                <p className="text-[14px] font-semibold text-[#1F3144] mt-1">
                  {location.taluk?.name ||
                    "Select a taluk above"}
                </p>

              </div>

            )}

            <button
              type="submit"
              disabled={
                saving ||
                (!statewide &&
                  !location.taluk?.id)
              }
              className="btn-primary disabled:opacity-50"
            >
              {saving
                ? "Publishing..."
                : "Publish Notification"}
            </button>

          </form>

        </div>

        <div>

          <div className="flex items-end justify-between gap-3 mb-3">

            <div>

              <h3 className="text-[17px] font-semibold text-[#1F3144]">
                Published Notifications
              </h3>

              <p className="text-[12px] text-[#9A9489] mt-0.5">
                Current scope: {selectedScope}
              </p>

            </div>

          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">

            {notes.map((note) => (

              <div
                key={note.id}
                className="bg-white rounded-xl border border-[#E8E2D8] p-4"
              >

                <div className="flex items-start justify-between gap-3">

                  <h4 className="font-semibold text-[#1F3144] text-[14.5px]">
                    {note.title}
                  </h4>

                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-[#F6F3ED] text-[#7A8598]">
                    {note.taluk_name ||
                      "Statewide"}
                  </span>

                </div>

                <p className="text-[13px] text-[#7A8598] mt-1 leading-5">
                  {note.message}
                </p>

                <div className="flex items-center justify-between gap-3 mt-2">

                  <p className="text-[11px] text-[#0B7A33] font-medium">
                    {note.type}
                  </p>

                  {note.created_at && (
                    <p className="text-[10.5px] text-[#9A9489]">
                      {new Date(
                        note.created_at
                      ).toLocaleString()}
                    </p>
                  )}

                </div>

              </div>

            ))}

            {notes.length === 0 && (

              <div className="bg-white rounded-xl border border-[#E8E2D8] p-8 text-center text-[13px] text-[#7A8598]">
                No notifications published for this scope.
              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}