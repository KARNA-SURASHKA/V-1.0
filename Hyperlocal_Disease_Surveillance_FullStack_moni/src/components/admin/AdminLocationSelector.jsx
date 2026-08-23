import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import { api } from "../../api";

export default function AdminLocationSelector({ value, onChange }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [taluks, setTaluks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getStates()
      .then(setStates)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!value.state?.id) {
      setDistricts([]);
      setTaluks([]);
      return;
    }

    api
      .getDistricts(value.state.id)
      .then(setDistricts)
      .catch((e) => setError(e.message));
  }, [value.state?.id]);

  useEffect(() => {
    if (!value.district?.id) {
      setTaluks([]);
      return;
    }

    api
      .getTaluks(value.district.id)
      .then(setTaluks)
      .catch((e) => setError(e.message));
  }, [value.district?.id]);

  const setState = (id) => {
    const state =
      states.find((s) => s.id === Number(id)) || null;

    onChange({
      state,
      district: null,
      taluk: null,
    });

    setDistricts([]);
    setTaluks([]);
    setError("");
  };

  const setDistrict = (id) => {
    const district =
      districts.find((d) => d.id === Number(id)) || null;

    onChange({
      ...value,
      district,
      taluk: null,
    });

    setTaluks([]);
    setError("");
  };

  const setTaluk = (id) => {
    const taluk =
      taluks.find((t) => t.id === Number(id)) || null;

    onChange({
      ...value,
      taluk,
    });

    setError("");
  };

  return (
    <section className="bg-white rounded-2xl border border-[#E8E2D8] p-4 sm:p-5 shadow-[0_1px_2px_rgba(31,49,68,0.03)]">

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

        <div className="flex items-center gap-2.5">

          <div className="w-9 h-9 rounded-lg bg-[#0B7A33]/10 flex items-center justify-center text-[#0B7A33]">
            <MapPinned size={18} />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#9A9489]">
              Viewing Region
            </p>

            <p className="text-[14px] font-semibold text-[#1F3144]">
              Choose the geographic scope for Admin data
            </p>
          </div>

        </div>

      </div>

      {error && (
        <p className="text-[12px] text-[#C62828] mb-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        <Select
          label="State"
          value={value.state?.id || ""}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">All States</option>

          {states.map((state) => (
            <option
              key={state.id}
              value={state.id}
            >
              {state.name}
            </option>
          ))}
        </Select>

        <Select
          label="District"
          value={value.district?.id || ""}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={!value.state}
        >
          <option value="">All Districts</option>

          {districts.map((district) => (
            <option
              key={district.id}
              value={district.id}
            >
              {district.name}
            </option>
          ))}
        </Select>

        <Select
          label="Taluk"
          value={value.taluk?.id || ""}
          onChange={(e) => setTaluk(e.target.value)}
          disabled={!value.district}
        >
          <option value="">All Taluks</option>

          {taluks.map((taluk) => (
            <option
              key={taluk.id}
              value={taluk.id}
            >
              {taluk.name}
            </option>
          ))}
        </Select>

      </div>
    </section>
  );
}

function Select({
  label,
  children,
  ...props
}) {
  return (
    <label className="block">

      <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A8598] mb-1.5">
        {label}
      </span>

      <select
        {...props}
        className="w-full rounded-xl border border-[#E8E2D8] bg-[#FCFAF6] px-3.5 py-2.5 text-[13.5px] text-[#1F3144] outline-none focus:ring-2 focus:ring-[#0B7A33]/15 focus:border-[#0B7A33]"
      >
        {children}
      </select>

    </label>
  );
}