import { useEffect, useState } from "react";

import {
  MapPin,
  X,
} from "lucide-react";

import { api } from "../../api";

export default function AdminLocationSelector({
  value,
  onChange,
  open,
  onClose,
}) {
  const [states, setStates] =
    useState([]);

  const [districts, setDistricts] =
    useState([]);

  const [taluks, setTaluks] =
    useState([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    api
      .getStates()
      .then((data) =>
        setStates(
          Array.isArray(data)
            ? data
            : []
        )
      )
      .catch((e) =>
        setError(
          e?.message ||
            "Unable to load states."
        )
      );
  }, [open]);

  useEffect(() => {
    if (!value?.state?.id) {
      setDistricts([]);
      return;
    }

    api
      .getDistricts(
        value.state.id
      )
      .then((data) =>
        setDistricts(
          Array.isArray(data)
            ? data
            : []
        )
      )
      .catch((e) =>
        setError(
          e?.message ||
            "Unable to load districts."
        )
      );
  }, [value?.state?.id]);

  useEffect(() => {
    if (!value?.district?.id) {
      setTaluks([]);
      return;
    }

    api
      .getTaluks(
        value.district.id
      )
      .then((data) =>
        setTaluks(
          Array.isArray(data)
            ? data
            : []
        )
      )
      .catch((e) =>
        setError(
          e?.message ||
            "Unable to load taluks."
        )
      );
  }, [value?.district?.id]);

  if (!open) {
    return null;
  }

  const handleState = (id) => {
    const selected =
      states.find(
        (item) =>
          item.id === Number(id)
      ) || null;

    onChange({
      state: selected,
      district: null,
      taluk: null,
    });

    setError("");
  };

  const handleDistrict = (
    id
  ) => {
    const selected =
      districts.find(
        (item) =>
          item.id === Number(id)
      ) || null;

    onChange({
      ...value,
      district: selected,
      taluk: null,
    });

    setError("");
  };

  const handleTaluk = (id) => {
    const selected =
      taluks.find(
        (item) =>
          item.id === Number(id)
      ) || null;

    onChange({
      ...value,
      taluk: selected,
    });

    setError("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10243A]/20 p-[20px] backdrop-blur-[1px]">

      <div className="w-full max-w-[500px] rounded-[12px] border border-[#DFE6E1] bg-white shadow-[0_20px_60px_rgba(16,36,58,.18)]">

        <div className="flex items-center justify-between border-b border-[#E7ECE9] px-[18px] py-[15px]">

          <div className="flex items-center gap-[10px]">

            <div className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#EAF6EE] text-[#087A32]">
              <MapPin
                size={15}
                strokeWidth={1.7}
              />
            </div>

            <div>

              <p className="text-[11px] font-semibold text-[#10243A]">
                Viewing Region
              </p>

              <p className="mt-[2px] text-[8px] text-[#718096]">
                Choose geographic scope
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-[#718096] hover:bg-[#F5F8F6]"
            aria-label="Close location selector"
          >
            <X size={16} />
          </button>

        </div>

        <div className="space-y-[14px] px-[18px] py-[18px]">

          {error && (
            <div className="rounded-[7px] border border-[#F0D2D2] bg-[#FFF5F5] px-[10px] py-[8px] text-[9px] text-[#C62828]">
              {error}
            </div>
          )}

          <SelectField
            label="State"
            value={
              value?.state?.id || ""
            }
            onChange={(e) =>
              handleState(
                e.target.value
              )
            }
          >
            <option value="">
              All States
            </option>

            {states.map(
              (state) => (
                <option
                  key={state.id}
                  value={state.id}
                >
                  {state.name}
                </option>
              )
            )}

          </SelectField>

          <SelectField
            label="District"
            value={
              value?.district?.id ||
              ""
            }
            disabled={!value?.state}
            onChange={(e) =>
              handleDistrict(
                e.target.value
              )
            }
          >
            <option value="">
              All Districts
            </option>

            {districts.map(
              (district) => (
                <option
                  key={district.id}
                  value={
                    district.id
                  }
                >
                  {district.name}
                </option>
              )
            )}

          </SelectField>

          <SelectField
            label="Taluk"
            value={
              value?.taluk?.id ||
              ""
            }
            disabled={
              !value?.district
            }
            onChange={(e) =>
              handleTaluk(
                e.target.value
              )
            }
          >
            <option value="">
              All Taluks
            </option>

            {taluks.map(
              (taluk) => (
                <option
                  key={taluk.id}
                  value={taluk.id}
                >
                  {taluk.name}
                </option>
              )
            )}

          </SelectField>

        </div>

        <div className="flex justify-end border-t border-[#E7ECE9] px-[18px] py-[12px]">

          <button
            type="button"
            onClick={onClose}
            className="rounded-[7px] bg-[#087A32] px-[14px] py-[7px] text-[9px] font-semibold text-white hover:bg-[#066728]"
          >
            Apply Location
          </button>

        </div>

      </div>

    </div>
  );
}

function SelectField({
  label,
  children,
  ...props
}) {
  return (
    <label className="block">

      <span className="mb-[5px] block text-[8px] font-semibold uppercase tracking-[0.06em] text-[#718096]">
        {label}
      </span>

      <select
        {...props}
        className="h-[36px] w-full rounded-[7px] border border-[#DFE6E1] bg-[#FAFCFA] px-[10px] text-[10px] text-[#26334A] outline-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>

    </label>
  );
}